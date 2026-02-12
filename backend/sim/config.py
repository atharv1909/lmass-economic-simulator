"""Configuration models using Pydantic for type safety and validation."""
from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, Literal, Dict, Any
import numpy as np


class ShockConfig(BaseModel):
    """Supply shock configuration."""
    type: Literal["lithium_supply", "demand", "route"] = "lithium_supply"
    magnitude: float = Field(0.4, ge=0.0, le=1.0, description="Shock size (0-1)")
    duration: int = Field(8, ge=1, description="Periods shock lasts")
    start: int = Field(6, ge=0, description="Period when shock begins")
    recovery_rate: float = Field(1.0, ge=0.0, le=1.0, description="Recovery speed (1=instant)")


class RulesConfig(BaseModel):
    """Policy/environment rules configuration."""
    tariff: float = Field(0.05, ge=0.0, le=1.0, description="Import tariff rate")
    route_capacity: float = Field(1.0, ge=0.1, le=2.0, description="Route capacity multiplier")
    storage_cap: float = Field(1.0, ge=0.5, le=3.0, description="Storage capacity multiplier")
    demand_elasticity: float = Field(1.2, ge=0.1, le=3.0, description="Price elasticity")
    subsidy_rate: float = Field(0.0, ge=0.0, le=0.5, description="Production subsidy")


class AgentConfig(BaseModel):
    """Agent configuration for simulation."""
    type: Literal["heuristic", "rnn", "random"] = "heuristic"
    checkpoint: Optional[str] = None
    params: Dict[str, Any] = Field(default_factory=dict)


class FirmConfig(BaseModel):
    """Individual firm characteristics."""
    capacity: float = Field(100.0, gt=0)
    cost_base: float = Field(50.0, gt=0)
    initial_inventory: float = Field(50.0, ge=0)
    storage_capacity: float = Field(100.0, gt=0)
    

class SimConfig(BaseModel):
    """Master simulation configuration."""
    model_config = ConfigDict(arbitrary_types_allowed=True, validate_default=True)
    seed: int = Field(42, ge=0)
    n_firms: int = Field(3, ge=2, le=10)
    horizon: int = Field(36, ge=10, le=200)
    
    # Shock
    shock: ShockConfig = Field(default_factory=ShockConfig)
    
    # Policy rules
    rules: RulesConfig = Field(default_factory=RulesConfig)
    
    # Agent
    agent: AgentConfig = Field(default_factory=AgentConfig)
    
    # Market parameters
    base_demand: float = Field(250.0, gt=0)
    base_price: float = Field(80.0, gt=0)
    base_supply: float = Field(300.0, gt=0)
    price_min: float = Field(40.0, gt=0)
    price_max: float = Field(200.0, gt=0)
    
    # Firm heterogeneity
    firm_configs: Optional[list[FirmConfig]] = None
    
    # Observation parameters
    obs_history_len: int = Field(6, ge=1, le=20)
    supply_noise_std: float = Field(0.15, ge=0.0, le=0.5)
    
    @field_validator('firm_configs')
    @classmethod
    def create_default_firms(cls, v, info):
        if v is None:
            n_firms = info.data.get('n_firms', 3)
            # Create heterogeneous firms
            base_cap = 100.0
            base_cost = 50.0
            return [
                FirmConfig(
                    capacity=base_cap * (0.9 + 0.2 * i / max(n_firms-1, 1)),
                    cost_base=base_cost * (0.95 + 0.1 * i / max(n_firms-1, 1)),
                    initial_inventory=50.0,
                    storage_capacity=100.0 * (0.9 + 0.2 * i / max(n_firms-1, 1))
                )
                for i in range(n_firms)
            ]
        return v
   


class ObservationSpace(BaseModel):
    """Definition of what agents observe (partial observability)."""
    own_inventory: float
    own_last_price: float
    own_last_production: float
    own_last_sales: float
    market_price_index: float
    trade_fill_ratio: float  # How much of procurement was filled
    supply_signal: float  # Noisy proxy of true supply
    demand_signal: float
    time_step: int
    # Regime parameters (known)
    tariff: float
    route_capacity: float
    storage_cap: float
    elasticity: float
