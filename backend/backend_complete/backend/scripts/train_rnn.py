#!/usr/bin/env python3
"""Lightweight RNN policy training script."""
import argparse
import sys
import os
from pathlib import Path
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sim.config import SimConfig
from sim.presets import get_preset, generate_random_config
from sim.env import EconomicSimulator
from agents.rnn_policy import RNNPolicy
from agents.heuristic import HeuristicAgent


def _obs_to_vector(obs, config):
    """Convert observation to vector."""
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
        float(obs.time_step) / config.horizon
    ], dtype=np.float32)


def collect_trajectories(n_trajectories: int = 50, max_horizon: int = 36):
    """Collect expert trajectories from heuristic agent."""
    all_obs = []
    all_actions = []
    
    print(f"Collecting {n_trajectories} trajectories...")
    
    for i in range(n_trajectories):
        config = generate_random_config(seed=i)
        config.horizon = min(max_horizon, config.horizon)
        
        env = EconomicSimulator(config)
        agents = [HeuristicAgent(firm_id=j, config=config) for j in range(config.n_firms)]
        
        observations = env.reset()
        for agent in agents:
            agent.reset()
        
        done = False
        while not done:
            for j, obs in enumerate(observations):
                obs_vector = _obs_to_vector(obs, config)
                all_obs.append(obs_vector)
                
                action = agents[j].act(obs)
                action_vector = np.array([
                    action['price'],
                    action['production_target'],
                    action['procurement_bid']
                ], dtype=np.float32)
                all_actions.append(action_vector)
            
            actions = [agents[j].act(observations[j]) for j in range(config.n_firms)]
            observations, info, done = env.step(actions)
        
        if (i + 1) % 10 == 0:
            print(f"  {i + 1}/{n_trajectories} collected")
    
    return np.array(all_obs), np.array(all_actions)


def train_policy(obs_data, action_data, epochs: int = 50, batch_size: int = 64, 
                lr: float = 0.001, device: str = 'cpu'):
    """Train RNN policy via behavioral cloning."""
    obs_dim = obs_data.shape[1]
    action_dim = action_data.shape[1]
    
    model = RNNPolicy(obs_dim, action_dim, hidden_dim=64)
    model.to(device)
    
    optimizer = optim.Adam(model.parameters(), lr=lr)
    
    # Convert to tensors
    obs_tensor = torch.FloatTensor(obs_data).to(device)
    action_tensor = torch.FloatTensor(action_data).to(device)
    
    n_samples = len(obs_data)
    
    print(f"Training on {n_samples} samples for {epochs} epochs...")
    
    for epoch in range(epochs):
        model.train()
        total_loss = 0
        n_batches = 0
        
        # Shuffle data
        indices = torch.randperm(n_samples)
        
        for i in range(0, n_samples, batch_size):
            batch_indices = indices[i:i+batch_size]
            batch_obs = obs_tensor[batch_indices].unsqueeze(1)  # Add seq dim
            batch_actions = action_tensor[batch_indices]
            
            # Forward pass
            pred_actions, _ = model(batch_obs)
            
            # Compute loss
            price_loss = nn.MSELoss()(pred_actions['price'], batch_actions[:, 0])
            prod_loss = nn.MSELoss()(pred_actions['production'], batch_actions[:, 1])
            proc_loss = nn.MSELoss()(pred_actions['procurement'], batch_actions[:, 2])
            
            loss = price_loss + prod_loss + proc_loss
            
            # Backward pass
            optimizer.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            
            total_loss += loss.item()
            n_batches += 1
        
        avg_loss = total_loss / n_batches
        if (epoch + 1) % 10 == 0:
            print(f"  Epoch {epoch+1}/{epochs}, Loss: {avg_loss:.4f}")
    
    print("✓ Training complete")
    return model


def main():
    parser = argparse.ArgumentParser(description='Train RNN policy')
    parser.add_argument('--trajectories', type=int, default=50,
                       help='Number of trajectories to collect')
    parser.add_argument('--epochs', type=int, default=50,
                       help='Training epochs')
    parser.add_argument('--batch-size', type=int, default=64,
                       help='Batch size')
    parser.add_argument('--lr', type=float, default=0.001,
                       help='Learning rate')
    parser.add_argument('--save', type=str, default='models/rnn_policy.pt',
                       help='Save checkpoint path')
    
    args = parser.parse_args()
    
    # Set device
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"Using device: {device}")
    
    # Collect data
    obs_data, action_data = collect_trajectories(args.trajectories)
    print(f"Collected {len(obs_data)} observation-action pairs")
    
    # Train model
    model = train_policy(obs_data, action_data, args.epochs, args.batch_size, 
                        args.lr, device)
    
    # Save checkpoint
    save_path = Path(args.save)
    save_path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), save_path)
    print(f"\n✓ Model saved to: {save_path}")


if __name__ == '__main__':
    main()
