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
