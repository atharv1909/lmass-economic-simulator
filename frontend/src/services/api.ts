import type { 
  SimulationResult, 
  HealthStatus, 
  SimulationParams, 
  SimulationConfig 
} from '@/types/simulation';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://lmass-economic-simulator.onrender.com';

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE;
  }

  async checkHealth(): Promise<HealthStatus | null> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000),
      });
      
      if (!response.ok) {
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.warn('Health check failed:', error);
      return null;
    }
  }

  async runSimulation(params: SimulationParams): Promise<SimulationResult> {
    const config: SimulationConfig = {
      n_firms: params.n_firms,
      horizon: params.horizon,
      seed: params.seed,
      shock: {
        type: 'lithium_supply',
        magnitude: params.shock_magnitude,
        duration: params.shock_duration,
        start: params.shock_start,
        recovery_rate: 1.0,
      },
      rules: {
        tariff: params.tariff,
        route_capacity: params.route_capacity,
        storage_cap: params.storage_cap,
        demand_elasticity: params.demand_elasticity,
        subsidy_rate: 0.0,
      },
      agent: {
        type: params.agent_type,
      },
    };

    const response = await fetch(`${this.baseUrl}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Simulation failed: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  async loadDemoData(filename: string): Promise<SimulationResult> {
    const response = await fetch(`/data/${filename}`);
    
    if (!response.ok) {
      throw new Error(`Failed to load demo data: ${filename}`);
    }

    return await response.json();
  }

  async compareSimulations(baselineParams: SimulationParams, learnedParams: SimulationParams): Promise<{
    baseline: SimulationResult;
    learned: SimulationResult;
  }> {
    // Try to use compare endpoint if available
    try {
      const response = await fetch(`${this.baseUrl}/simulate/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseline: this.buildConfig(baselineParams),
          learned: this.buildConfig(learnedParams),
        }),
        signal: AbortSignal.timeout(60000),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Compare endpoint not available, falling back to individual calls');
    }

    // Fallback: run simulations sequentially
    const [baseline, learned] = await Promise.all([
      this.runSimulation(baselineParams),
      this.runSimulation(learnedParams),
    ]);

    return { baseline, learned };
  }

  private buildConfig(params: SimulationParams): SimulationConfig {
    return {
      n_firms: params.n_firms,
      horizon: params.horizon,
      seed: params.seed,
      shock: {
        type: 'lithium_supply',
        magnitude: params.shock_magnitude,
        duration: params.shock_duration,
        start: params.shock_start,
        recovery_rate: 1.0,
      },
      rules: {
        tariff: params.tariff,
        route_capacity: params.route_capacity,
        storage_cap: params.storage_cap,
        demand_elasticity: params.demand_elasticity,
        subsidy_rate: 0.0,
      },
      agent: {
        type: params.agent_type,
      },
    };
  }
}

export const apiService = new ApiService();
