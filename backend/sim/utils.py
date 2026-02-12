"""Utility functions for simulation."""
import numpy as np
from typing import List, Tuple
import random


def set_seed(seed: int) -> None:
    """Set random seeds for reproducibility."""
    random.seed(seed)
    np.random.seed(seed)
    try:
        import torch
        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)
    except ImportError:
        pass


def softmax(x: np.ndarray, temperature: float = 1.0) -> np.ndarray:
    """Numerically stable softmax."""
    x = np.array(x) / temperature
    exp_x = np.exp(x - np.max(x))
    return exp_x / exp_x.sum()


def logit_allocation(prices: np.ndarray, sensitivity: float = 2.0) -> np.ndarray:
    """Allocate demand share based on prices (lower price = higher share)."""
    # Invert prices for allocation (lower price = higher score)
    inv_prices = 1.0 / (np.array(prices) + 1e-6)
    return softmax(inv_prices, temperature=1.0/sensitivity)


def moving_average(data: np.ndarray, window: int) -> np.ndarray:
    """Compute moving average."""
    if len(data) < window:
        return np.array([np.mean(data[:i+1]) for i in range(len(data))])
    ret = np.cumsum(data, dtype=float)
    ret[window:] = ret[window:] - ret[:-window]
    result = np.zeros(len(data))
    result[:window-1] = [np.mean(data[:i+1]) for i in range(window-1)]
    result[window-1:] = ret[window - 1:] / window
    return result


def compute_correlation(series1: np.ndarray, series2: np.ndarray, window: int = 6) -> float:
    """Compute rolling correlation coefficient."""
    if len(series1) < 2 or len(series2) < 2:
        return 0.0
    
    n = min(len(series1), len(series2), window)
    s1 = series1[-n:]
    s2 = series2[-n:]
    
    if np.std(s1) < 1e-6 or np.std(s2) < 1e-6:
        return 0.0
    
    corr = np.corrcoef(s1, s2)[0, 1]
    return 0.0 if np.isnan(corr) else corr


def detect_synchronized_throttling(production_matrix: np.ndarray, 
                                   capacity_vector: np.ndarray,
                                   window: int = 4) -> float:
    """Detect if firms are synchronously throttling production.
    
    Args:
        production_matrix: (n_firms, time_steps) production history
        capacity_vector: (n_firms,) capacity levels
        window: periods to look back
        
    Returns:
        Score 0-1 indicating synchronization strength
    """
    if production_matrix.shape[1] < window:
        return 0.0
    
    recent = production_matrix[:, -window:]
    capacities = capacity_vector.reshape(-1, 1)
    
    # Utilization rates
    util_rates = recent / (capacities + 1e-6)
    
    # Check if all firms are underutilizing
    avg_util = np.mean(util_rates, axis=1)
    if np.all(avg_util < 0.7):  # All below 70% capacity
        # Check synchronization (low variance across firms)
        variance = np.var(avg_util)
        if variance < 0.01:  # Very synchronized
            return min(1.0, (0.7 - np.mean(avg_util)) * 2)
    
    return 0.0


def price_volatility(prices: np.ndarray) -> float:
    """Compute coefficient of variation for prices."""
    if len(prices) < 2:
        return 0.0
    std = np.std(prices)
    mean = np.mean(prices)
    return std / (mean + 1e-6)


def gini_coefficient(values: np.ndarray) -> float:
    """Compute Gini coefficient for inequality."""
    sorted_values = np.sort(values)
    n = len(sorted_values)
    index = np.arange(1, n + 1)
    return (2 * np.sum(index * sorted_values)) / (n * np.sum(sorted_values)) - (n + 1) / n
