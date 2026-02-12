"""Base agent interface for policy implementations."""
from abc import ABC, abstractmethod
from typing import Dict, Any, List
import numpy as np


class BaseAgent(ABC):
    """Abstract base class for all agent types."""
    
    def __init__(self, firm_id: int, config: Any):
        """Initialize agent.
        
        Args:
            firm_id: Index of the firm this agent controls
            config: Simulation configuration
        """
        self.firm_id = firm_id
        self.config = config
        self.observation_history: List[Any] = []
        
    @abstractmethod
    def act(self, observation: Any) -> Dict[str, float]:
        """Generate action from observation.
        
        Args:
            observation: Current observation from environment
            
        Returns:
            Dictionary with keys: 'price', 'production_target', 'procurement_bid'
        """
        pass
    
    def update_history(self, observation: Any) -> None:
        """Update observation history."""
        self.observation_history.append(observation)
        # Keep only recent history to save memory
        max_history = getattr(self.config, 'obs_history_len', 20)
        if len(self.observation_history) > max_history:
            self.observation_history = self.observation_history[-max_history:]
    
    def reset(self) -> None:
        """Reset agent state."""
        self.observation_history = []
    
    def get_action_space_bounds(self) -> Dict[str, tuple]:
        """Return action space bounds."""
        return {
            'price': (self.config.price_min, self.config.price_max),
            'production_target': (0, float('inf')),  # Limited by capacity in env
            'procurement_bid': (0, float('inf'))
        }


class RandomAgent(BaseAgent):
    """Random baseline agent for testing."""
    
    def act(self, observation: Any) -> Dict[str, float]:
        """Take random actions within valid ranges."""
        self.update_history(observation)
        
        price = np.random.uniform(self.config.price_min, self.config.price_max)
        production = np.random.uniform(0, 100)  # Arbitrary
        procurement = np.random.uniform(20, 100)
        
        return {
            'price': float(price),
            'production_target': float(production),
            'procurement_bid': float(procurement)
        }
