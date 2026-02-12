"""Agent loader and factory functions."""
from typing import List, Any
from .base import BaseAgent, RandomAgent
from .heuristic import HeuristicAgent
from .rnn_policy import RNNAgent


def create_agents(config: Any) -> List[BaseAgent]:
    """Create agents based on configuration.
    
    Args:
        config: SimConfig with agent configuration
        
    Returns:
        List of agent instances (one per firm)
    """
    agent_type = config.agent.type
    n_firms = config.n_firms
    
    agents = []
    
    if agent_type == 'heuristic':
        params = config.agent.params
        for i in range(n_firms):
            agent = HeuristicAgent(firm_id=i, config=config, params=params)
            agents.append(agent)
            
    elif agent_type == 'rnn':
        checkpoint = config.agent.checkpoint
        for i in range(n_firms):
            agent = RNNAgent(firm_id=i, config=config, checkpoint=checkpoint)
            agents.append(agent)
            
    elif agent_type == 'random':
        for i in range(n_firms):
            agent = RandomAgent(firm_id=i, config=config)
            agents.append(agent)
            
    else:
        raise ValueError(f"Unknown agent type: {agent_type}")
    
    return agents


def reset_agents(agents: List[BaseAgent]) -> None:
    """Reset all agents."""
    for agent in agents:
        agent.reset()
