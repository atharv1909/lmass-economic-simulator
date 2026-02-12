"""Metrics computation for simulation evaluation."""
import numpy as np
from typing import Dict, List, Tuple
from .utils import (compute_correlation, detect_synchronized_throttling, 
                    price_volatility, moving_average)


class MetricsCalculator:
    """Compute stability, welfare, and cartel likelihood metrics."""
    
    def __init__(self, config):
        self.config = config
        self.n_firms = config.n_firms
        
    def compute_stability_score(self, 
                               prices_history: np.ndarray,
                               production_history: np.ndarray,
                               demand_history: np.ndarray) -> Dict[str, float]:
        """Compute stability score (0-1, higher is better).
        
        Components:
        - Price volatility penalty
        - Production drop penalty
        - Unmet demand penalty
        """
        # Price stability (lower volatility = higher score)
        all_prices = prices_history.flatten()
        price_vol = price_volatility(all_prices)
        price_stability = max(0.0, 1.0 - price_vol)
        
        # Production stability (penalize drops)
        total_production = np.sum(production_history, axis=0)
        if len(total_production) > 1:
            prod_changes = np.diff(total_production)
            prod_drops = np.sum(np.minimum(prod_changes, 0))
            max_possible_drop = -np.mean(total_production) * len(prod_changes)
            prod_stability = max(0.0, 1.0 + prod_drops / (abs(max_possible_drop) + 1e-6))
        else:
            prod_stability = 1.0
        
        # Demand fulfillment
        total_sales = np.sum(production_history, axis=0)  # Simplified: sales = production
        if len(demand_history) > 0:
            fulfillment_rate = np.minimum(total_sales, demand_history) / (demand_history + 1e-6)
            demand_stability = np.mean(fulfillment_rate)
        else:
            demand_stability = 1.0
        
        # Weighted combination
        overall = 0.35 * price_stability + 0.35 * prod_stability + 0.30 * demand_stability
        
        return {
            "overall": float(np.clip(overall, 0.0, 1.0)),
            "price_component": float(price_stability),
            "production_component": float(prod_stability),
            "demand_component": float(demand_stability)
        }
    
    def compute_welfare_proxy(self,
                             sales_history: np.ndarray,
                             prices_history: np.ndarray,
                             supply_history: np.ndarray) -> Dict[str, float]:
        """Compute welfare proxy metric.
        
        Welfare ≈ Total Sales Value - Scarcity Penalty
        """
        # Total economic value
        total_value = np.sum(sales_history * prices_history)
        
        # Scarcity penalty (when supply drops, welfare suffers)
        base_supply = supply_history[0] if len(supply_history) > 0 else 1.0
        scarcity = np.sum(np.maximum(0, base_supply - supply_history))
        scarcity_penalty = scarcity * 10.0  # Arbitrary scaling
        
        welfare = total_value - scarcity_penalty
        
        return {
            "welfare_score": float(welfare),
            "total_value": float(total_value),
            "scarcity_penalty": float(scarcity_penalty),
            "avg_consumer_surplus": float(total_value / len(sales_history.flatten()))
        }
    
    def compute_cartel_likelihood(self,
                                 prices_history: np.ndarray,
                                 production_history: np.ndarray,
                                 capacities: np.ndarray,
                                 supply_history: np.ndarray) -> Dict[str, float]:
        """Compute cartel likelihood score (0-1).
        
        Signals of collusion:
        1. High price correlation across firms
        2. Synchronized production throttling (all below capacity during scarcity)
        3. High margins under scarcity (restricting supply to boost prices)
        """
        n_firms = prices_history.shape[0]
        time_steps = prices_history.shape[1]
        
        # Signal 1: Price correlation
        if n_firms >= 2 and time_steps >= 6:
            correlations = []
            for i in range(n_firms):
                for j in range(i+1, n_firms):
                    corr = compute_correlation(prices_history[i], prices_history[j], window=6)
                    correlations.append(corr)
            avg_price_corr = np.mean(correlations) if correlations else 0.0
            price_signal = max(0.0, avg_price_corr)  # 0-1
        else:
            price_signal = 0.0
        
        # Signal 2: Synchronized throttling
        throttle_signal = detect_synchronized_throttling(
            production_history, capacities, window=4
        )
        
        # Signal 3: High margins under scarcity
        # During low supply, if prices are high and production is restricted
        if time_steps >= 10:
            # Find scarcity periods
            base_supply = supply_history[0]
            scarcity_mask = supply_history < (base_supply * 0.8)
            
            if np.any(scarcity_mask):
                avg_price_during_scarcity = np.mean(prices_history[:, scarcity_mask])
                avg_price_normal = np.mean(prices_history[:, ~scarcity_mask]) if np.any(~scarcity_mask) else avg_price_during_scarcity
                
                price_markup = (avg_price_during_scarcity / (avg_price_normal + 1e-6)) - 1.0
                margin_signal = min(1.0, max(0.0, price_markup / 0.5))  # Normalize
            else:
                margin_signal = 0.0
        else:
            margin_signal = 0.0
        
        # Weighted combination
        cartel_score = 0.40 * price_signal + 0.35 * throttle_signal + 0.25 * margin_signal
        
        return {
            "cartel_likelihood": float(np.clip(cartel_score, 0.0, 1.0)),
            "price_correlation_signal": float(price_signal),
            "throttling_signal": float(throttle_signal),
            "margin_signal": float(margin_signal)
        }
    
    def compute_cartel_timeseries(self,
                                 prices_history: np.ndarray,
                                 production_history: np.ndarray,
                                 capacities: np.ndarray) -> np.ndarray:
        """Compute rolling cartel score over time."""
        time_steps = prices_history.shape[1]
        scores = np.zeros(time_steps)
        
        window = 6
        for t in range(window, time_steps):
            price_window = prices_history[:, t-window:t]
            prod_window = production_history[:, t-window:t]
            
            # Price correlation in window
            n_firms = prices_history.shape[0]
            if n_firms >= 2:
                correlations = []
                for i in range(n_firms):
                    for j in range(i+1, n_firms):
                        corr = compute_correlation(price_window[i], price_window[j], window=window)
                        correlations.append(corr)
                price_corr = np.mean(correlations) if correlations else 0.0
            else:
                price_corr = 0.0
            
            # Throttling in window
            throttle = detect_synchronized_throttling(prod_window, capacities, window=min(4, window))
            
            scores[t] = 0.6 * max(0, price_corr) + 0.4 * throttle
        
        return scores
    
    def compute_adaptation_speed(self,
                                production_history: np.ndarray,
                                shock_start: int,
                                shock_duration: int) -> float:
        """Measure how quickly production adapts post-shock.
        
        Returns: recovery time in periods (lower is better/faster)
        """
        shock_end = shock_start + shock_duration
        if shock_end >= production_history.shape[1]:
            return float(production_history.shape[1] - shock_start)
        
        total_prod = np.sum(production_history, axis=0)
        
        # Pre-shock baseline
        if shock_start > 0:
            baseline = np.mean(total_prod[:shock_start])
        else:
            baseline = total_prod[0]
        
        # Find when production recovers to 90% of baseline
        post_shock = total_prod[shock_end:]
        recovery_threshold = baseline * 0.9
        
        for i, prod in enumerate(post_shock):
            if prod >= recovery_threshold:
                return float(i + 1)  # Periods to recover
        
        return float(len(post_shock))  # Did not recover
