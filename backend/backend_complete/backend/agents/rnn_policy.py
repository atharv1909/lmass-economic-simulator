"""RNN-based policy with belief inference (PyTorch)."""
import numpy as np
from typing import Dict, Any, Optional
import torch
import torch.nn as nn
import torch.nn.functional as F
from .base import BaseAgent


class RNNPolicy(nn.Module):
    """GRU-based policy network for belief inference.
    
    Takes observation sequences and outputs actions.
    Lightweight design for fast training on CPU.
    """
    
    def __init__(self, obs_dim: int, action_dim: int, hidden_dim: int = 64):
        super().__init__()
        self.obs_dim = obs_dim
        self.action_dim = action_dim
        self.hidden_dim = hidden_dim
        
        # Observation encoder
        self.obs_encoder = nn.Sequential(
            nn.Linear(obs_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim)
        )
        
        # GRU for temporal processing
        self.gru = nn.GRU(hidden_dim, hidden_dim, batch_first=True)
        
        # Action heads
        self.price_head = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Linear(hidden_dim // 2, 1)
        )
        
        self.production_head = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Linear(hidden_dim // 2, 1)
        )
        
        self.procurement_head = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Linear(hidden_dim // 2, 1)
        )
        
    def forward(self, obs_sequence: torch.Tensor, hidden: Optional[torch.Tensor] = None):
        """Forward pass.
        
        Args:
            obs_sequence: (batch, seq_len, obs_dim) or (seq_len, obs_dim)
            hidden: Optional GRU hidden state
            
        Returns:
            actions: Dict of action tensors
            new_hidden: Updated hidden state
        """
        if obs_sequence.dim() == 2:
            obs_sequence = obs_sequence.unsqueeze(0)  # Add batch dim
        
        # Encode observations
        encoded = self.obs_encoder(obs_sequence)  # (batch, seq_len, hidden_dim)
        
        # Process through GRU
        gru_out, new_hidden = self.gru(encoded, hidden)  # (batch, seq_len, hidden_dim)
        
        # Take last timestep
        last_out = gru_out[:, -1, :]  # (batch, hidden_dim)
        
        # Generate actions
        price_raw = self.price_head(last_out)  # (batch, 1)
        production_raw = self.production_head(last_out)
        procurement_raw = self.procurement_head(last_out)
        
        actions = {
            'price': price_raw.squeeze(-1),
            'production': F.softplus(production_raw.squeeze(-1)),  # Ensure positive
            'procurement': F.softplus(procurement_raw.squeeze(-1))
        }
        
        return actions, new_hidden


class RNNAgent(BaseAgent):
    """Agent using RNN policy for decision making."""
    
    def __init__(self, firm_id: int, config: Any, checkpoint: Optional[str] = None):
        super().__init__(firm_id, config)
        
        # Observation dimension (from ObservationSpace)
        self.obs_dim = 14  # All fields in ObservationSpace
        self.action_dim = 3  # price, production, procurement
        
        # Create policy network
        self.policy = RNNPolicy(self.obs_dim, self.action_dim, hidden_dim=64)
        
        # Set device (CPU-friendly, use GPU if available)
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.policy.to(self.device)
        
        # Load checkpoint if provided
        if checkpoint:
            try:
                state_dict = torch.load(checkpoint, map_location=self.device)
                self.policy.load_state_dict(state_dict)
                self.policy.eval()
                print(f"Loaded RNN policy from {checkpoint}")
            except Exception as e:
                print(f"Warning: Could not load checkpoint {checkpoint}: {e}")
                print("Using randomly initialized policy.")
        
        # Hidden state for GRU
        self.hidden = None
        
    def act(self, observation: Any) -> Dict[str, float]:
        """Generate action using RNN policy."""
        self.update_history(observation)
        
        # Convert observation to tensor
        obs_vector = self._obs_to_vector(observation)
        obs_tensor = torch.FloatTensor(obs_vector).unsqueeze(0).to(self.device)  # (1, obs_dim)
        
        # Get action from policy
        with torch.no_grad():
            actions, self.hidden = self.policy(obs_tensor, self.hidden)
        
        # Convert to numpy and scale to valid ranges
        price = self._scale_price(actions['price'].cpu().item())
        production = actions['production'].cpu().item()
        procurement = actions['procurement'].cpu().item()
        
        return {
            'price': float(price),
            'production_target': float(production),
            'procurement_bid': float(procurement)
        }
    
    def reset(self) -> None:
        """Reset agent and hidden state."""
        super().reset()
        self.hidden = None
    
    def _obs_to_vector(self, obs: Any) -> np.ndarray:
        """Convert ObservationSpace to numpy vector."""
        return np.array([
            obs.own_inventory,
            obs.own_last_price,
            obs.own_last_production,
            obs.own_last_sales,
            obs.market_price_index,
            obs.trade_fill_ratio,
            obs.supply_signal,
            obs.demand_signal,
            float(obs.time_step),
            obs.tariff,
            obs.route_capacity,
            obs.storage_cap,
            obs.elasticity,
            float(obs.time_step) / self.config.horizon  # Normalized time
        ], dtype=np.float32)
    
    def _scale_price(self, raw_price: float) -> float:
        """Scale network output to valid price range."""
        # Sigmoid to [0, 1] then scale to [price_min, price_max]
        normalized = 1.0 / (1.0 + np.exp(-raw_price))
        scaled = (self.config.price_min + 
                 (self.config.price_max - self.config.price_min) * normalized)
        return scaled
