"""Core simulation environment with partial observability."""
import numpy as np
from typing import Dict, List, Tuple, Any, Optional
from .config import SimConfig, ObservationSpace
from .dynamics import MarketDynamics
from .metrics import MetricsCalculator
from .utils import set_seed


class EconomicSimulator:
    """Multi-agent economic simulator with supply shocks and partial observability."""
    
    def __init__(self, config: SimConfig):
        """Initialize simulator.
        
        Args:
            config: Simulation configuration
        """
        self.config = config
        set_seed(config.seed)
        
        self.n_firms = config.n_firms
        self.horizon = config.horizon
        self.current_step = 0
        
        # Components
        self.dynamics = MarketDynamics(config)
        self.metrics_calc = MetricsCalculator(config)
        
        # Firm characteristics
        self.capacities = np.array([f.capacity for f in config.firm_configs])
        self.cost_bases = np.array([f.cost_base for f in config.firm_configs])
        self.storage_caps = np.array([f.storage_capacity * config.rules.storage_cap 
                                      for f in config.firm_configs])
        
        # State variables
        self.inventories = np.array([f.initial_inventory for f in config.firm_configs])
        self.last_prices = np.full(self.n_firms, config.base_price)
        self.last_production = np.zeros(self.n_firms)
        self.last_sales = np.zeros(self.n_firms)
        self.last_procurement = np.zeros(self.n_firms)
        self.last_fill_ratio = 1.0
        
        # History tracking
        self.history = {
            "prices": [],
            "production": [],
            "sales": [],
            "inventory": [],
            "procurement": [],
            "supply_true": [],
            "demand": [],
            "market_price_index": [],
            "fill_ratio": [],
            "route_capacity": [],
            "tariff": [],
        }
        
    def reset(self) -> List[ObservationSpace]:
        """Reset environment to initial state."""
        set_seed(self.config.seed)
        
        self.current_step = 0
        self.inventories = np.array([f.initial_inventory for f in self.config.firm_configs])
        self.last_prices = np.full(self.n_firms, self.config.base_price)
        self.last_production = np.zeros(self.n_firms)
        self.last_sales = np.zeros(self.n_firms)
        self.last_procurement = np.zeros(self.n_firms)
        self.last_fill_ratio = 1.0
        
        # Clear history
        for key in self.history:
            self.history[key] = []
        
        # Return initial observations
        return self._get_observations()
    
    def _get_observations(self) -> List[ObservationSpace]:
        """Generate partial observations for each agent.
        
        Each firm observes:
        - Own state (inventory, last actions, last sales)
        - Market signals (price index, fill ratio, noisy supply signal)
        - Policy parameters (tariff, route capacity, etc.)
        - Time step
        """
        # Compute market price index from last period
        if len(self.history["market_price_index"]) > 0:
            market_price = self.history["market_price_index"][-1]
        else:
            market_price = self.config.base_price
        
        # Noisy supply signal (agents don't see true supply)
        true_supply = self.dynamics.compute_supply_with_shock(
            self.current_step, self.config.shock
        )
        supply_noise = np.random.normal(0, self.config.supply_noise_std * true_supply)
        supply_signal = max(0, true_supply + supply_noise)
        
        # Demand signal (lagged)
        if len(self.history["demand"]) > 0:
            demand_signal = self.history["demand"][-1]
        else:
            demand_signal = self.config.base_demand
        
        observations = []
        for i in range(self.n_firms):
            obs = ObservationSpace(
                own_inventory=float(self.inventories[i]),
                own_last_price=float(self.last_prices[i]),
                own_last_production=float(self.last_production[i]),
                own_last_sales=float(self.last_sales[i]),
                market_price_index=float(market_price),
                trade_fill_ratio=float(self.last_fill_ratio),
                supply_signal=float(supply_signal),
                demand_signal=float(demand_signal),
                time_step=self.current_step,
                tariff=self.config.rules.tariff,
                route_capacity=self.config.rules.route_capacity,
                storage_cap=self.config.rules.storage_cap,
                elasticity=self.config.rules.demand_elasticity
            )
            observations.append(obs)
        
        return observations

    def step(self, actions: List[Dict[str, float]]) -> Tuple[List[ObservationSpace], 
                                                               Dict[str, Any], bool]:
        """Execute one time step.
        
        Args:
            actions: List of action dicts for each firm with keys:
                - price: desired price
                - production_target: desired production quantity
                - procurement_bid: desired lithium procurement
                
        Returns:
            observations: New observations for each firm
            info: Step information including rewards, metrics
            done: Whether simulation is complete
        """
        # Extract actions
        firm_prices = np.array([a["price"] for a in actions])
        production_targets = np.array([a["production_target"] for a in actions])
        procurement_bids = np.array([a["procurement_bid"] for a in actions])
        
        # Clip actions to valid ranges
        firm_prices = np.clip(firm_prices, self.config.price_min, self.config.price_max)
        production_targets = np.clip(production_targets, 0, self.capacities)
        procurement_bids = np.clip(procurement_bids, 0, np.inf)
        
        # === PHASE 1: LITHIUM PROCUREMENT ===
        true_supply = self.dynamics.compute_supply_with_shock(
            self.current_step, self.config.shock
        )
        
        lithium_allocated, fill_ratio = self.dynamics.allocate_lithium_procurement(
            procurement_bids, true_supply, self.config.rules.route_capacity
        )
        
        # Apply tariff cost (simplified: reduces effective allocation)
        tariff_loss = lithium_allocated * self.config.rules.tariff
        net_lithium = lithium_allocated - tariff_loss
        net_lithium = np.maximum(net_lithium, 0)
        
        # === PHASE 2: PRODUCTION ===
        # Determine feasible production given inventory + new lithium
        available_lithium = self.inventories + net_lithium
        feasible_production = self.dynamics.compute_production_feasibility(
            production_targets, available_lithium, lithium_per_unit=1.0
        )
        
        # Actual production
        actual_production = feasible_production
        lithium_used = actual_production * 1.0  # 1:1 ratio
        
        # === PHASE 3: MARKET CLEARING ===
        market_price_index = self.dynamics.compute_market_price_index(
            firm_prices, actual_production
        )
        
        total_demand = self.dynamics.compute_demand(market_price_index, demand_shock=1.0)
        
        sales = self.dynamics.allocate_demand(
            firm_prices, total_demand, actual_production
        )
        
        # === PHASE 4: UPDATE STATE ===
        # Update inventories
        self.inventories = self.dynamics.update_inventories(
            self.inventories,
            net_lithium,
            lithium_used,
            self.storage_caps
        )
        
        # Store for observations
        self.last_prices = firm_prices
        self.last_production = actual_production
        self.last_sales = sales
        self.last_procurement = lithium_allocated
        self.last_fill_ratio = fill_ratio
        
        # Record history
        self.history["prices"].append(firm_prices.copy())
        self.history["production"].append(actual_production.copy())
        self.history["sales"].append(sales.copy())
        self.history["inventory"].append(self.inventories.copy())
        self.history["procurement"].append(lithium_allocated.copy())
        self.history["supply_true"].append(true_supply)
        self.history["demand"].append(total_demand)
        self.history["market_price_index"].append(market_price_index)
        self.history["fill_ratio"].append(fill_ratio)
        self.history["route_capacity"].append(self.config.rules.route_capacity)
        self.history["tariff"].append(self.config.rules.tariff)
        
        # Advance time
        self.current_step += 1
        done = self.current_step >= self.horizon
        
        # Get new observations
        new_observations = self._get_observations()
        
        # Compute step info
        info = {
            "step": self.current_step,
            "prices": firm_prices.tolist(),
            "production": actual_production.tolist(),
            "sales": sales.tolist(),
            "market_price": float(market_price_index),
            "demand": float(total_demand),
            "supply": float(true_supply),
            "fill_ratio": float(fill_ratio),
        }
        
        return new_observations, info, done
    
    def get_results(self) -> Dict[str, Any]:
        """Compile final results with metrics."""
        # Convert history to arrays
        prices_array = np.array(self.history["prices"]).T  # (n_firms, time)
        production_array = np.array(self.history["production"]).T
        sales_array = np.array(self.history["sales"]).T
        inventory_array = np.array(self.history["inventory"]).T
        supply_array = np.array(self.history["supply_true"])
        demand_array = np.array(self.history["demand"])
        
        # Compute metrics
        stability = self.metrics_calc.compute_stability_score(
            prices_array, production_array, demand_array
        )
        
        welfare = self.metrics_calc.compute_welfare_proxy(
            sales_array, prices_array, supply_array
        )
        
        cartel = self.metrics_calc.compute_cartel_likelihood(
            prices_array, production_array, self.capacities, supply_array
        )
        
        cartel_timeseries = self.metrics_calc.compute_cartel_timeseries(
            prices_array, production_array, self.capacities
        )
        
        adapt_speed = self.metrics_calc.compute_adaptation_speed(
            production_array, 
            self.config.shock.start, 
            self.config.shock.duration
        )
        
        # Format results
        results = {
            "t": list(range(len(self.history["prices"]))),
            "prices": {f"firm_{i+1}": prices_array[i].tolist() 
                       for i in range(self.n_firms)},
            "production": {f"firm_{i+1}": production_array[i].tolist() 
                           for i in range(self.n_firms)},
            "sales": {f"firm_{i+1}": sales_array[i].tolist() 
                      for i in range(self.n_firms)},
            "inventory": {f"firm_{i+1}": inventory_array[i].tolist() 
                          for i in range(self.n_firms)},
            "market": {
                "price_index": self.history["market_price_index"],
                "demand": self.history["demand"],
                "supply_true": self.history["supply_true"],
                "route_capacity": self.history["route_capacity"],
                "tariff": self.history["tariff"],
                "fill_ratio": self.history["fill_ratio"],
            },
            "metrics": {
                "stability": stability["overall"],
                "stability_breakdown": stability,
                "welfare": welfare["welfare_score"],
                "welfare_breakdown": welfare,
                "cartel_likelihood": cartel["cartel_likelihood"],
                "adapt_speed": float(adapt_speed),
            },
            "cartel": {
                "score_t": cartel_timeseries.tolist(),
                "signals": cartel,
            },
            "config": {
                "n_firms": self.n_firms,
                "horizon": self.horizon,
                "shock": self.config.shock.model_dump(),
                "rules": self.config.rules.model_dump(),
            }
        }
        
        return results
