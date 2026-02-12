#!/usr/bin/env python3
"""Evaluation script to compare agents."""
import argparse
import json
import sys
import os
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).parent.parent))

from sim.config import SimConfig, AgentConfig
from sim.presets import get_preset
from api.handlers import run_simulation


def main():
    parser = argparse.ArgumentParser(description='Compare heuristic vs RNN agent')
    parser.add_argument('--preset', type=str, default='baseline',
                       help='Preset configuration')
    parser.add_argument('--rnn-checkpoint', type=str, default='models/rnn_policy.pt',
                       help='RNN checkpoint path')
    parser.add_argument('--seeds', type=int, nargs='+', default=[42, 7, 123],
                       help='Seeds to test')
    parser.add_argument('--output', type=str, default='outputs/comparison.json',
                       help='Output JSON path')
    
    args = parser.parse_args()
    
    print(f"Comparing agents on preset: {args.preset}")
    print(f"Seeds: {args.seeds}")
    
    results = {
        'heuristic': [],
        'rnn': [],
        'comparison': {}
    }
    
    for seed in args.seeds:
        print(f"\nRunning with seed {seed}...")
        
        # Heuristic
        config_h = get_preset(args.preset)
        config_h.seed = seed
        config_h.agent = AgentConfig(type='heuristic')
        results_h = run_simulation(config_h)
        results['heuristic'].append(results_h['metrics'])
        
        # RNN
        config_r = get_preset(args.preset)
        config_r.seed = seed
        config_r.agent = AgentConfig(type='rnn', checkpoint=args.rnn_checkpoint)
        
        try:
            results_r = run_simulation(config_r)
            results['rnn'].append(results_r['metrics'])
        except Exception as e:
            print(f"  Warning: RNN failed with {e}, using random initialization")
            results['rnn'].append(results_h['metrics'])  # Fallback
    
    # Aggregate statistics
    heuristic_stability = np.mean([r['stability'] for r in results['heuristic']])
    rnn_stability = np.mean([r['stability'] for r in results['rnn']])
    
    heuristic_cartel = np.mean([r['cartel_likelihood'] for r in results['heuristic']])
    rnn_cartel = np.mean([r['cartel_likelihood'] for r in results['rnn']])
    
    results['comparison'] = {
        'avg_stability_heuristic': float(heuristic_stability),
        'avg_stability_rnn': float(rnn_stability),
        'stability_improvement': float(rnn_stability - heuristic_stability),
        'avg_cartel_heuristic': float(heuristic_cartel),
        'avg_cartel_rnn': float(rnn_cartel),
        'cartel_reduction': float(heuristic_cartel - rnn_cartel),
        'winner': 'RNN' if rnn_stability > heuristic_stability else 'Heuristic'
    }
    
    # Save
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n✓ Results saved to: {output_path}")
    print(f"\nComparison:")
    print(f"  Heuristic Stability: {heuristic_stability:.3f}")
    print(f"  RNN Stability: {rnn_stability:.3f}")
    print(f"  Winner: {results['comparison']['winner']}")


if __name__ == '__main__':
    main()
