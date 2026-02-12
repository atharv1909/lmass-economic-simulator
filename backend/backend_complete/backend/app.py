"""FastAPI application entry point."""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api.schemas import (
    SimulateRequest, SimulateResponse,
    CompareRequest, CompareResponse,
    HealthResponse
)
from api.handlers import handle_simulate, handle_simulate_baseline, handle_compare

# Create FastAPI app
app = FastAPI(
    title="Multi-Agent Economic Simulator API",
    description="Backend for strategic economic simulation with supply shocks",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", response_model=HealthResponse)
async def root():
    """Root endpoint."""
    return {
        "status": "online",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }


@app.post("/simulate", response_model=SimulateResponse)
async def simulate(request: SimulateRequest):
    """Run simulation with specified configuration."""
    try:
        results = handle_simulate(request.model_dump())
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/simulate/baseline", response_model=SimulateResponse)
async def simulate_baseline(request: SimulateRequest):
    """Run simulation with heuristic baseline agent."""
    try:
        results = handle_simulate_baseline(request.model_dump())
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/simulate/compare", response_model=CompareResponse)
async def simulate_compare(request: CompareRequest):
    """Compare heuristic vs RNN policy."""
    try:
        results = handle_compare(request.model_dump())
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
