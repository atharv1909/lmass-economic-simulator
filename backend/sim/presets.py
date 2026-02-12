"""Preset simulation configurations for quick testing."""
from .config import SimConfig, ShockConfig, RulesConfig, AgentConfig


def get_preset(name: str) -> SimConfig:
    """Get a preset configuration by name."""
    presets = {
        "baseline": baseline_config,
        "high_shock": high_shock_config,
        "cartel_prone": cartel_prone_config,
        "policy_test": policy_test_config,
        "quick_test": quick_test_config,
    }
    
    if name not in presets:
        raise ValueError(f"Unknown preset: {name}. Available: {list(presets.keys())}")
    
    return presets[name]()


def baseline_config() -> SimConfig:
    """Standard 3-firm competition with moderate shock."""
    return SimConfig(
        seed=42,
        n_firms=3,
        horizon=36,
        shock=ShockConfig(
            type="lithium_supply",
            magnitude=0.40,
            duration=8,
            start=10
        ),
        rules=RulesConfig(
            tariff=0.05,
            route_capacity=1.0,
            storage_cap=1.0,
            demand_elasticity=1.2
        ),
        agent=AgentConfig(type="heuristic"),
        base_demand=250.0,
        base_price=80.0,
        base_supply=300.0
    )


def high_shock_config() -> SimConfig:
    """Severe supply disruption scenario."""
    return SimConfig(
        seed=7,
        n_firms=3,
        horizon=48,
        shock=ShockConfig(
            type="lithium_supply",
            magnitude=0.65,  # 65% supply drop
            duration=12,
            start=8,
            recovery_rate=0.5  # Slow recovery
        ),
        rules=RulesConfig(
            tariff=0.08,
            route_capacity=0.7,  # Constrained routes
            storage_cap=1.2,
            demand_elasticity=1.5
        ),
        agent=AgentConfig(type="heuristic"),
        base_demand=280.0,
        base_price=85.0,
        base_supply=320.0
    )


def cartel_prone_config() -> SimConfig:
    """Configuration that encourages collusive behavior."""
    return SimConfig(
        seed=123,
        n_firms=3,
        horizon=40,
        shock=ShockConfig(
            type="lithium_supply",
            magnitude=0.50,
            duration=10,
            start=12
        ),
        rules=RulesConfig(
            tariff=0.02,  # Low tariff
            route_capacity=0.8,
            storage_cap=1.5,  # High storage capacity
            demand_elasticity=0.8  # Inelastic demand
        ),
        agent=AgentConfig(type="heuristic", params={"collusion_bias": 0.3}),
        base_demand=220.0,
        base_price=90.0,
        base_supply=280.0
    )


def policy_test_config() -> SimConfig:
    """Configuration for testing policy interventions."""
    return SimConfig(
        seed=99,
        n_firms=4,
        horizon=36,
        shock=ShockConfig(
            type="lithium_supply",
            magnitude=0.45,
            duration=10,
            start=8
        ),
        rules=RulesConfig(
            tariff=0.10,  # Higher tariff to test
            route_capacity=1.2,  # Expanded routes
            storage_cap=0.8,  # Limited storage
            demand_elasticity=1.3,
            subsidy_rate=0.05  # Production subsidy
        ),
        agent=AgentConfig(type="heuristic"),
        base_demand=260.0,
        base_price=82.0,
        base_supply=310.0
    )


def quick_test_config() -> SimConfig:
    """Fast test configuration for debugging."""
    return SimConfig(
        seed=1,
        n_firms=2,
        horizon=12,
        shock=ShockConfig(
            type="lithium_supply",
            magnitude=0.30,
            duration=3,
            start=4
        ),
        rules=RulesConfig(
            tariff=0.05,
            route_capacity=1.0,
            storage_cap=1.0,
            demand_elasticity=1.0
        ),
        agent=AgentConfig(type="heuristic"),
        base_demand=200.0,
        base_price=75.0,
        base_supply=250.0
    )


def generate_random_config(seed: int = None) -> SimConfig:
    """Generate a random configuration for domain randomization.
    
    Useful for meta-learning / training robust policies.
    """
    import numpy as np
    if seed is not None:
        np.random.seed(seed)
    
    return SimConfig(
        seed=np.random.randint(0, 10000),
        n_firms=np.random.choice([2, 3, 4]),
        horizon=np.random.randint(24, 60),
        shock=ShockConfig(
            type="lithium_supply",
            magnitude=np.random.uniform(0.3, 0.7),
            duration=np.random.randint(6, 15),
            start=np.random.randint(5, 12),
            recovery_rate=np.random.uniform(0.5, 1.0)
        ),
        rules=RulesConfig(
            tariff=np.random.uniform(0.0, 0.15),
            route_capacity=np.random.uniform(0.6, 1.5),
            storage_cap=np.random.uniform(0.8, 2.0),
            demand_elasticity=np.random.uniform(0.8, 2.0)
        ),
        agent=AgentConfig(type="heuristic"),
        base_demand=np.random.uniform(200, 300),
        base_price=np.random.uniform(70, 95),
        base_supply=np.random.uniform(250, 350)
    )
