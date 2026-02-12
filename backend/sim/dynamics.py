"""Market dynamics and state transitions."""
import numpy as np
from typing import Tuple, Dict, Any
from .utils import logit_allocation, softmax


class MarketDynamics:
    """Handles market clearing, allocation, and state transitions."""
    
    def __init__(self, config):
        self.config = config
        self.base_demand = config.base_demand
        self.base_price = config.base_price
        self.base_supply = config.base_supply
        self.elasticity = config.rules.demand_elasticity
        
    def compute_demand(self, price_index: float, demand_shock: float = 1.0) -> float:
        """Compute aggregate demand based on price and shocks.
        
        D = D0 * (P/P0)^(-elasticity) * shock
        """
        price_ratio = price_index / self.base_price
        demand = self.base_demand * (price_ratio ** (-self.elasticity)) * demand_shock
        return max(0.0, demand)
    
    def compute_market_price_index(self, firm_prices: np.ndarray, 
                                   firm_quantities: np.ndarray) -> float:
        """Compute weighted average market price."""
        total_qty = np.sum(firm_quantities) + 1e-6
        weights = firm_quantities / total_qty
        return float(np.sum(weights * firm_prices))
    
    def allocate_demand(self, firm_prices: np.ndarray, 
                       total_demand: float,
                       firm_max_supply: np.ndarray) -> np.ndarray:
        """Allocate demand to firms based on prices and capacity.
        
        Lower prices get higher share, but limited by production capacity.
        """
        n_firms = len(firm_prices)
        
        # Get market shares based on prices (lower price = higher share)
        shares = logit_allocation(firm_prices, sensitivity=2.5)
        
        # Desired demand for each firm
        desired = shares * total_demand
        
        # Cap by production capacity
        realized = np.minimum(desired, firm_max_supply)
        
        # If total realized < total demand, redistribute unmet
        total_realized = np.sum(realized)
        if total_realized < total_demand:
            unmet = total_demand - total_realized
            # Give unmet to firms with spare capacity
            spare_capacity = firm_max_supply - realized
            if np.sum(spare_capacity) > 0:
                additional = (spare_capacity / np.sum(spare_capacity)) * unmet
                realized += additional
                realized = np.minimum(realized, firm_max_supply)
        
        return realized
    
    def compute_supply_with_shock(self, 
                                  t: int, 
                                  shock_config: Any) -> float:
        """Compute true lithium supply with shock applied."""
        base = self.base_supply
        
        shock_start = shock_config.start
        shock_duration = shock_config.duration
        shock_magnitude = shock_config.magnitude
        shock_end = shock_start + shock_duration
        
        if t < shock_start:
            return base
        elif t < shock_end:
            # During shock
            return base * (1.0 - shock_magnitude)
        else:
            # Recovery phase
            recovery_rate = shock_config.recovery_rate
            periods_since = t - shock_end
            recovery_factor = min(1.0, recovery_rate * (periods_since + 1) / 5)
            current_supply = base * (1.0 - shock_magnitude * (1.0 - recovery_factor))
            return current_supply
    
    def allocate_lithium_procurement(self,
                                     firm_bids: np.ndarray,
                                     available_supply: float,
                                     route_capacity: float) -> Tuple[np.ndarray, float]:
        """Allocate lithium to firms based on procurement bids and constraints.
        
        Args:
            firm_bids: (n_firms,) how much each firm wants to buy
            available_supply: total lithium available
            route_capacity: multiplier on max import capacity
            
        Returns:
            allocations: (n_firms,) actual lithium allocated
            fill_ratio: fraction of total bids filled (0-1)
        """
        total_bid = np.sum(firm_bids)
        if total_bid < 1e-6:
            return np.zeros_like(firm_bids), 1.0
        
        # Apply route capacity constraint
        max_import = available_supply * route_capacity
        effective_supply = min(available_supply, max_import)
        
        if total_bid <= effective_supply:
            # Everyone gets what they want
            return firm_bids.copy(), 1.0
        else:
            # Pro-rata allocation
            fill_ratio = effective_supply / total_bid
            allocations = firm_bids * fill_ratio
            return allocations, fill_ratio
    
    def update_inventories(self,
                          current_inventory: np.ndarray,
                          lithium_inflow: np.ndarray,
                          production_usage: np.ndarray,
                          storage_capacities: np.ndarray) -> np.ndarray:
        """Update firm inventories with bounds checking."""
        new_inventory = current_inventory + lithium_inflow - production_usage
        # Clip to [0, storage_capacity]
        new_inventory = np.clip(new_inventory, 0.0, storage_capacities)
        return new_inventory
    
    def compute_production_feasibility(self,
                                       desired_production: np.ndarray,
                                       available_lithium: np.ndarray,
                                       lithium_per_unit: float = 1.0) -> np.ndarray:
        """Determine feasible production given lithium constraints.
        
        Each unit of production requires lithium_per_unit lithium.
        """
        max_from_lithium = available_lithium / lithium_per_unit
        feasible = np.minimum(desired_production, max_from_lithium)
        return feasible
