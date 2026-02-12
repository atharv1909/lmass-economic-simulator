 ## 🌍 Economic Shaper
Multi-Agent Strategic Economic Simulator Under Supply Shocks

A real-time, interactive policy testing platform for simulating strategic firm behavior under resource shocks such as lithium supply disruptions.
---

## 🌐 Live Deployment

### 🔗 Frontend (Dashboard)

The interactive policy testing dashboard is deployed on Vercel:

**Live URL:**  
https://economic-shaper.vercel.app/

The dashboard supports:

- 🎛 Demo Mode (offline JSON simulations)
- 🌍 Live Mode (real-time backend simulations)
- 📊 Interactive charts for prices, production, inventory, sales
- 🧠 Cartel detection visualization
- ⚖ Stability and welfare metrics
- 🧩 Configurable shock & policy parameters

---

### 🖥 Backend (Simulation Engine)

The FastAPI backend powering the simulations is deployed on Render:

**API Base URL:**  
https://lmass-economic-simulator.onrender.com

Available endpoints:

- `GET /health` — Service status check
- `POST /simulate` — Run full economic simulation
- *(Optional)* `POST /simulate/compare` — Compare agents (if enabled)

---

## 🏗 System Architecture

Frontend (Vercel – React/Next.js)  
⬇  
Live API Calls  
⬇  
FastAPI Backend (Render)  
⬇  
Multi-Agent Economic Simulator  
⬇  
Structured JSON Output  
⬇  
Dynamic Visualization

---

## 🔄 Simulation Modes

### 1️⃣ Demo Mode
Loads pre-generated simulation outputs from:

- `/public/data/baseline.json`
- `/public/data/rnn_test.json`

Ensures offline functionality and reliable demonstrations.

---

### 2️⃣ Live Mode
Sends real-time simulation requests to:

POST https://lmass-economic-simulator.onrender.com/simulate


Users can modify:

- Shock magnitude, duration, start
- Tariff rate
- Route capacity
- Storage cap
- Demand elasticity
- Horizon
- Number of firms
- Agent type (heuristic / rnn)

Results are computed live and returned as structured JSON.

---

## 📊 Output Structure

The simulation returns:

- `t` — timesteps
- `prices` — per-firm price trajectories
- `production` — per-firm production levels
- `sales` — per-firm sales
- `inventory` — per-firm inventory levels
- `market` — aggregate market variables
- `metrics` — stability, welfare, cartel likelihood
- `cartel` — cartel signal over time
- `config` — scenario configuration
- `debug` — additional runtime info (if available)

All charts dynamically adapt to returned JSON keys.

---

## 🎯 Project Vision

Economic Shaper enables strategic policy testing under supply shocks.

Instead of relying on static assumptions, users can simulate:

- Tariff hikes
- Route disruptions
- Severe supply shocks
- Agent strategy differences

And instantly observe:

- Price volatility
- Production collapse or stabilization
- Cartel emergence risk
- Market stability shifts

This provides a safe experimentation environment for industrial and policy decision-making.

---

## 🚀 Status

- ✅ Backend deployed and operational
- ✅ Frontend deployed on Vercel
- ✅ Live API integration working
- ✅ Demo fallback implemented
- ✅ Dynamic charts (no hardcoded data)

Production-ready interactive simulation platform.
