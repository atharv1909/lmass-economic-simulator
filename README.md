# LMASS: Multi-Agent Strategic Economic Simulator Under Supply Shocks

A learning-based multi-agent economic simulator designed to model strategic firm behavior under supply shocks such as lithium crises in EV supply chains.

This system enables policy testing, cartel detection, and stability optimization through adaptive agent interactions and belief inference.

---

## 🌍 Live Backend Deployment

The FastAPI backend is deployed on Render:

**Base URL:**

https://lmass-economic-simulator.onrender.com

---

## 🚀 Available Endpoints

### 1️⃣ Health Check
`GET /health`

Returns system status and version.

Example:
https://lmass-economic-simulator.onrender.com/health


---

### 2️⃣ Run Simulation
`POST /simulate`

Runs a full economic simulation under configurable shock and policy parameters.

---

## 📦 Sample Simulation Request

```json
{
  "seed": 7,
  "n_firms": 3,
  "horizon": 36,
  "shock": {
    "type": "lithium_supply",
    "magnitude": 0.45,
    "duration": 10,
    "start": 8
  },
  "rules": {
    "tariff": 0.08,
    "route_capacity": 0.7,
    "storage_cap": 1.2,
    "demand_elasticity": 1.1
  },
  "agent": {
    "type": "heuristic"
  }
}
```
📊 Simulation Response Structure

The API returns a JSON object containing:

t → Time steps

prices → Price trajectories per firm

production → Production levels per firm

sales → Sales per firm

inventory → Inventory levels per firm

market → Market-level aggregates

metrics → Stability, welfare, cartel likelihood

cartel → Cartel signal over time

config → Scenario configuration

debug → Debug metadata

🧠 Key Features

Partial observability with noisy supply signals

Supply shock simulation (lithium crisis scenarios)

Market clearing and price competition

Cartel detection metrics

Policy testing (tariffs, route constraints, storage limits)

RNN-based belief inference agent

Heuristic baseline agents

Domain randomization for training

FastAPI REST endpoints

🛡 CORS Configuration

CORS middleware is enabled to allow frontend browser-based API calls.

⚡ Performance

36-period rollout: <1 second

RNN training (CPU): ~2–3 minutes

Memory usage: <500MB

Fully compatible with Kaggle + Render

📌 Project Purpose

This simulator enables:

Strategic policy testing before real-world rollout

Detection of cartel formation under supply stress

Stabilization of industrial markets during shocks

Evaluation of regulatory interventions
