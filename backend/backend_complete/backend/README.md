# Multi-Agent Strategic Economic Simulator Backend

## Overview
Production-quality backend for simulating multi-agent strategic interactions under supply shocks (lithium supply crisis) with partial observability, belief inference, and cartel emergence detection.

## Architecture

### Core Components
- **Simulator (`sim/`)**: Environment dynamics, market clearing, shock models
- **Agents (`agents/`)**: Rule-based heuristics and RNN-based learned policies
- **API (`api/`)**: FastAPI endpoints for simulation requests
- **Scripts (`scripts/`)**: CLI runners for rollouts, training, evaluation

### Key Features
1. **Partial Observability**: Agents see only local information + noisy market signals
2. **Supply Shocks**: Lithium supply disruptions with configurable magnitude/duration
3. **Cartel Detection**: Metrics for identifying collusive behavior patterns
4. **Policy Testing**: Test tariffs, route capacity, storage, elasticity changes
5. **Belief Inference**: RNN-based policy learns from observation histories

## Quick Start (Kaggle)
```python
# 1. Install dependencies
!pip install -q -r requirements.txt

# 2. Run a rollout
!python scripts/run_rollout.py --seed 42 --output outputs/test.json

# 3. Start API server (background)
import subprocess, time, threading
def start_server():
    subprocess.run(["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"])
threading.Thread(target=start_server, daemon=True).start()
time.sleep(3)

# 4. Test endpoint
import requests
response = requests.post("http://localhost:8000/simulate", json={
    "seed": 7,
    "n_firms": 3,
    "horizon": 36,
    "shock": {"type": "lithium_supply", "magnitude": 0.45, "duration": 10, "start": 8},
    "rules": {"tariff": 0.08, "route_capacity": 0.7},
    "agent": {"type": "heuristic"}
})
print(response.json()["metrics"])
```

## Local Development
```bash
# Install
pip install -r requirements.txt

# Run server
uvicorn app:app --reload

# Test
curl -X POST http://localhost:8000/simulate -H "Content-Type: application/json" -d @test_request.json
```

## API Endpoints

### `GET /health`
Health check

### `POST /simulate`
Run simulation with specified agent type
- Request: See `api/schemas.py` for full schema
- Response: Time series + metrics + cartel signals

### `POST /simulate/baseline`
Run with rule-based heuristic agent

### `POST /simulate/compare`
Compare heuristic vs RNN policy side-by-side

## Configuration

Edit `sim/presets.py` for predefined scenarios:
- `baseline`: Standard 3-firm competition
- `high_shock`: Severe supply disruption
- `cartel_prone`: Parameters encouraging collusion
- `policy_test`: Testing policy interventions

## Training RNN Policy
```bash
# Quick training (lightweight, ~2 min on CPU)
python scripts/train_rnn.py --epochs 50 --save models/rnn_policy.pt

# Use trained policy
# In request JSON: {"agent": {"type": "rnn", "checkpoint": "models/rnn_policy.pt"}}
```

## Metrics Explained

- **Stability Score (0-1)**: Higher = less volatility, better shock absorption
- **Welfare Proxy**: Total economic value minus scarcity penalties
- **Cartel Likelihood (0-1)**: Probability of collusive behavior based on:
  - Price correlation across firms
  - Synchronized production throttling
  - High margins under scarcity
- **Adaptation Speed**: How quickly market adjusts post-shock

## Memory & Performance

- Optimized for Kaggle environments (CPU, 16GB RAM)
- Typical 36-period rollout: <1 second
- RNN training: ~2 minutes for 50 epochs on CPU
- No CUDA required (but will use GPU if available)

## Extension Points

1. **MAPPO Integration**: See `agents/rnn_policy.py` for RL-ready interface
2. **Meta-Learning**: Domain randomization hooks in `sim/presets.py`
3. **Advanced Belief Models**: Extend `agents/rnn_policy.py` with attention
4. **Multi-Market**: Extend `sim/dynamics.py` for interconnected markets

## Citation
```
Multi-Agent Strategic Economic Simulator
Kaggle Competition Backend
2024
```

## License
MIT
