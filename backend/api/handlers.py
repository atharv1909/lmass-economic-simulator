"""API request handlers."""
from typing import Dict, Any
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sim.config import SimConfig, ShockConfig, RulesConfig, AgentConfig
from sim.env import EconomicSimulator
from sim.presets import get_preset
from agents.loader import create_agents, reset_agents


def run_simulation(config: SimConfig) -> Dict[str, Any]:
    """Run a single simulation and return results.
    
    Args:
        config: Simulation configuration
        
    Returns:
        Results dictionary with time series and metrics
    """
    # Create environment
    env = EconomicSimulator(config)
    
    # Create agents
    agents = create_agents(config)
    
    # Reset environment and agents
    observations = env.reset()
    reset_agents(agents)
    
    # Run simulation
    done = False
    while not done:
        # Get actions from agents
        actions = []
        for i, agent in enumerate(agents):
            action = agent.act(observations[i])
            actions.append(action)
        
        # Step environment
        observations, info, done = env.step(actions)
    
    # Get results
    results = env.get_results()
    
    return results


def handle_simulate(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """Handle /simulate endpoint.
    
    Args:
        request_data: Request dictionary
        
    Returns:
        Simulation results
    """
    # Check if preset is requested
    if request_data.get('preset'):
        config = get_preset(request_data['preset'])
        # Override with any provided parameters
        if 'seed' in request_data:
            config.seed = request_data['seed']
        if 'agent' in request_data:
            config.agent = AgentConfig(**request_data['agent'])
    else:
        # Build config from request
        config = SimConfig(
            seed=request_data.get('seed', 42),
            n_firms=request_data.get('n_firms', 3),
            horizon=request_data.get('horizon', 36),
            shock=ShockConfig(**request_data.get('shock', {})),
            rules=RulesConfig(**request_data.get('rules', {})),
            agent=AgentConfig(**request_data.get('agent', {}))
        )
    
    # Run simulation
    results = run_simulation(config)
    
    return results


def handle_simulate_baseline(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """Handle /simulate/baseline endpoint (force heuristic)."""
    # Override agent type
    request_data['agent'] = {'type': 'heuristic'}
    return handle_simulate(request_data)


def handle_compare(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """Handle /simulate/compare endpoint.
    
    Runs both heuristic and RNN policies and compares results.
    """
    # Run heuristic
    heuristic_request = request_data.copy()
    heuristic_request['agent'] = {'type': 'heuristic'}
    heuristic_results = handle_simulate(heuristic_request)
    
    # Run RNN
    rnn_request = request_data.copy()
    rnn_checkpoint = request_data.get('rnn_checkpoint')
    rnn_request['agent'] = {
        'type': 'rnn',
        'checkpoint': rnn_checkpoint
    }
    rnn_results = handle_simulate(rnn_request)
    
    # Compute comparison metrics
    comparison = {
        'stability_diff': (rnn_results['metrics']['stability'] - 
                          heuristic_results['metrics']['stability']),
        'welfare_diff': (rnn_results['metrics']['welfare'] - 
                        heuristic_results['metrics']['welfare']),
        'cartel_diff': (rnn_results['metrics']['cartel_likelihood'] - 
                       heuristic_results['metrics']['cartel_likelihood']),
        'adapt_speed_diff': (rnn_results['metrics']['adapt_speed'] - 
                            heuristic_results['metrics']['adapt_speed']),
        'winner': 'rnn' if rnn_results['metrics']['stability'] > 
                          heuristic_results['metrics']['stability'] else 'heuristic'
    }
    
    return {
        'heuristic_results': heuristic_results,
        'rnn_results': rnn_results,
        'comparison': comparison
    }
