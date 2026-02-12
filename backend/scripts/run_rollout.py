#!/usr/bin/env python3
"""CLI script to run simulation rollouts."""
import argparse
import json
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sim.config import SimConfig
from sim.presets import get_preset
from api.handlers import run_simulation


def main():
    parser = argparse.ArgumentParser(description='Run economic simulation rollout')
    parser.add_argument('--preset', type=str, default='baseline',
                       help='Preset configuration name')
    parser.add_argument('--seed', type=int, default=None,
                       help='Random seed (overrides preset)')
    parser.add_argument('--output', type=str, default='outputs/rollout.json',
                       help='Output JSON file path')
    parser.add_argument('--agent', type=str, default=None, choices=['heuristic', 'rnn', 'random'],
                       help='Agent type (overrides preset)')
    parser.add_argument('--checkpoint', type=str, default=None,
                       help='RNN checkpoint path (if agent=rnn)')
    
    args = parser.parse_args()
    
    # Load preset config
    print(f"Loading preset: {args.preset}")
    config = get_preset(args.preset)
    
    # Override with arguments
    if args.seed is not None:
        config.seed = args.seed
    
    if args.agent is not None:
        config.agent.type = args.agent
        if args.agent == 'rnn' and args.checkpoint:
            config.agent.checkpoint = args.checkpoint
    
    print(f"Configuration: n_firms={config.n_firms}, horizon={config.horizon}, agent={config.agent.type}")
    print(f"Shock: magnitude={config.shock.magnitude}, start={config.shock.start}, duration={config.shock.duration}")
    
    # Run simulation
    print("Running simulation...")
    results = run_simulation(config)
    
    # Save results
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n✓ Results saved to: {output_path}")
    print(f"\nMetrics:")
    print(f"  Stability: {results['metrics']['stability']:.3f}")
    print(f"  Welfare: {results['metrics']['welfare']:.1f}")
    print(f"  Cartel Likelihood: {results['metrics']['cartel_likelihood']:.3f}")
    print(f"  Adaptation Speed: {results['metrics']['adapt_speed']:.1f} periods")


if __name__ == '__main__':
    main()
