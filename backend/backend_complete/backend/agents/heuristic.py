"""Rule-based heuristic agent with economic reasoning."""
import numpy as np
from typing import Dict, Any
from .base import BaseAgent


class HeuristicAgent(BaseAgent):
    """Sophisticated rule-based agent with adaptive strategies.
    
    Strategy:
    1. Price setting: Based on inventory, supply signals, and market conditions
    2. Production: Target inventory level with capacity constraints
    3. Procurement: Anticipate needs based on production plans and inventory
    """
    
    def __init__(self, firm_id: int, config: Any, params: Dict[str, Any] = None):
        super().__init__(firm_id, config)
        self.params = params or {}
        
        # Strategy parameters
        self.target_inventory_ratio = self.params.get('target_inventory', 0.6)
        self.price_sensitivity = self.params.get('price_sensitivity', 0.15)
        self.collusion_bias = self.params.get('collusion_bias', 0.0)  # 0-1
        self.safety_stock_multiplier = self.params.get('safety_stock', 1.2)
        
    def act(self, observation: Any) -> Dict[str, float]:
        """Generate actions using heuristic rules."""
        self.update_history(observation)
        
        obs = observation
        
        # === PRICING STRATEGY ===
        price = self._compute_price(obs)
        
        # === PRODUCTION STRATEGY ===
        production_target = self._compute_production(obs)
        
        # === PROCUREMENT STRATEGY ===
        procurement_bid = self._compute_procurement(obs, production_target)
        
        return {
            'price': float(price),
            'production_target': float(production_target),
            'procurement_bid': float(procurement_bid)
        }
    
    def _compute_price(self, obs: Any) -> float:
        """Compute pricing based on market conditions and inventory."""
        base_price = obs.market_price_index
        
        # Adjust based on inventory level
        inventory_ratio = obs.own_inventory / (self.config.base_supply / self.config.n_firms * 0.3)
        
        if inventory_ratio < 0.3:
            # Low inventory -> raise price
            price_adjustment = 1.0 + self.price_sensitivity
        elif inventory_ratio > 1.5:
            # High inventory -> lower price to sell
            price_adjustment = 1.0 - self.price_sensitivity * 0.5
        else:
            price_adjustment = 1.0
        
        # Adjust based on supply scarcity signal
        supply_ratio = obs.supply_signal / self.config.base_supply
        if supply_ratio < 0.8:
            # Scarcity -> increase price
            scarcity_premium = 1.0 + (0.8 - supply_ratio) * 0.5
            price_adjustment *= scarcity_premium
        
        # Apply tariff pass-through (partial)
        tariff_passthrough = 1.0 + (obs.tariff * 0.5)
        price_adjustment *= tariff_passthrough
        
        # Collusion bias (if configured)
        if self.collusion_bias > 0:
            # Follow market price more closely (less undercutting)
            collusion_factor = 1.0 + self.collusion_bias * 0.1
            price_adjustment *= collusion_factor
        
        final_price = base_price * price_adjustment
        
        # Clip to valid range
        final_price = np.clip(final_price, self.config.price_min, self.config.price_max)
        
        return float(final_price)
    
    def _compute_production(self, obs: Any) -> float:
        """Compute production target based on inventory management."""
        # Target inventory level
        target_inventory = self.config.base_supply / self.config.n_firms * self.target_inventory_ratio
        
        # Current gap
        inventory_gap = target_inventory - obs.own_inventory
        
        # Base production to maintain target
        base_production = obs.demand_signal / self.config.n_firms
        
        # Adjust based on inventory gap
        if inventory_gap > 0:
            # Below target -> produce more
            production_target = base_production + inventory_gap * 0.5
        else:
            # Above target -> produce less
            production_target = base_production + inventory_gap * 0.3
        
        # Consider fill ratio (if procurement is constrained, produce less)
        if obs.trade_fill_ratio < 0.7:
            production_target *= 0.8  # Conservative during supply constraints
        
        # Ensure non-negative
        production_target = max(0.0, production_target)
        
        return float(production_target)
    
    def _compute_procurement(self, obs: Any, production_target: float) -> float:
        """Compute procurement bid to support production plans."""
        # Lithium needed for production (1:1 ratio)
        lithium_for_production = production_target
        
        # Safety stock
        safety_stock = (self.config.base_supply / self.config.n_firms * 0.2 * 
                       self.safety_stock_multiplier)
        
        # Total need
        total_need = lithium_for_production + safety_stock - obs.own_inventory
        
        # Adjust based on supply signal
        supply_ratio = obs.supply_signal / self.config.base_supply
        if supply_ratio < 0.7:
            # Scarcity -> bid more aggressively
            procurement_bid = total_need * 1.3
        else:
            procurement_bid = total_need * 1.0
        
        # Consider route capacity constraints
        if obs.route_capacity < 1.0:
            # Constrained routes -> bid more to secure allocation
            procurement_bid *= 1.2
        
        # Ensure non-negative
        procurement_bid = max(0.0, procurement_bid)
        
        return float(procurement_bid)
