"""API request/response schemas."""
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Literal


class ShockRequest(BaseModel):
    type: Literal["lithium_supply", "demand", "route"] = "lithium_supply"
    magnitude: float = Field(0.4, ge=0.0, le=1.0)
    duration: int = Field(8, ge=1)
    start: int = Field(6, ge=0)
    recovery_rate: float = Field(1.0, ge=0.0, le=1.0)


class RulesRequest(BaseModel):
    tariff: float = Field(0.05, ge=0.0, le=1.0)
    route_capacity: float = Field(1.0, ge=0.1, le=2.0)
    storage_cap: float = Field(1.0, ge=0.5, le=3.0)
    demand_elasticity: float = Field(1.2, ge=0.1, le=3.0)
    subsidy_rate: float = Field(0.0, ge=0.0, le=0.5)


class AgentRequest(BaseModel):
    type: Literal["heuristic", "rnn", "random"] = "heuristic"
    checkpoint: Optional[str] = None
    params: Dict[str, Any] = Field(default_factory=dict)


class SimulateRequest(BaseModel):
    seed: int = Field(42, ge=0)
    n_firms: int = Field(3, ge=2, le=10)
    horizon: int = Field(36, ge=10, le=200)
    shock: ShockRequest = Field(default_factory=ShockRequest)
    rules: RulesRequest = Field(default_factory=RulesRequest)
    agent: AgentRequest = Field(default_factory=AgentRequest)
    preset: Optional[str] = None  # If provided, override with preset


class SimulateResponse(BaseModel):
    t: List[int]
    prices: Dict[str, List[float]]
    production: Dict[str, List[float]]
    sales: Dict[str, List[float]]
    inventory: Dict[str, List[float]]
    market: Dict[str, List[float]]
    metrics: Dict[str, Any]
    cartel: Dict[str, Any]
    config: Dict[str, Any]
    debug: Optional[Dict[str, Any]] = None


class CompareRequest(BaseModel):
    """Request to compare heuristic vs RNN."""
    seed: int = Field(42, ge=0)
    n_firms: int = Field(3, ge=2, le=10)
    horizon: int = Field(36, ge=10, le=200)
    shock: ShockRequest = Field(default_factory=ShockRequest)
    rules: RulesRequest = Field(default_factory=RulesRequest)
    rnn_checkpoint: Optional[str] = None


class CompareResponse(BaseModel):
    heuristic_results: SimulateResponse
    rnn_results: SimulateResponse
    comparison: Dict[str, Any]


class HealthResponse(BaseModel):
    status: str
    version: str
    timestamp: str
