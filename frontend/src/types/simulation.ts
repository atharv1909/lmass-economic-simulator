// Simulation Data Types

export interface ShockConfig {
  type: string;
  magnitude: number;
  duration: number;
  start: number;
  recovery_rate?: number;
}

export interface RulesConfig {
  tariff: number;
  route_capacity: number;
  storage_cap: number;
  demand_elasticity: number;
  subsidy_rate?: number;
}

export interface AgentConfig {
  type: 'heuristic' | 'rnn';
}

export interface SimulationConfig {
  n_firms: number;
  horizon: number;
  seed?: number;
  shock: ShockConfig;
  rules: RulesConfig;
  agent?: AgentConfig;
}

export interface FirmData {
  [firmName: string]: number[];
}

export interface MarketData {
  price_index: number[];
  demand: number[];
  supply_true: number[];
  route_capacity: number[];
  tariff: number[];
  fill_ratio: number[];
}

export interface StabilityBreakdown {
  overall: number;
  price_component: number;
  production_component: number;
  demand_component: number;
}

export interface WelfareBreakdown {
  welfare_score: number;
  total_value: number;
  scarcity_penalty: number;
  avg_consumer_surplus: number;
}

export interface Metrics {
  stability: number;
  stability_breakdown: StabilityBreakdown;
  welfare: number;
  welfare_breakdown: WelfareBreakdown;
  cartel_likelihood: number;
  adapt_speed: number;
}

export interface CartelSignals {
  cartel_likelihood: number;
  price_correlation_signal: number;
  throttling_signal: number;
  margin_signal: number;
}

export interface CartelData {
  score_t: number[];
  signals: CartelSignals;
}

export interface SimulationResult {
  t: number[];
  prices: FirmData;
  production: FirmData;
  sales: FirmData;
  inventory: FirmData;
  market: MarketData;
  metrics: Metrics;
  cartel: CartelData;
  config: SimulationConfig;
}

export interface HealthStatus {
  status: string;
  version: string;
  timestamp: string;
}

export type SimulationMode = 'demo' | 'live';

export interface SimulationParams {
  seed: number;
  n_firms: number;
  horizon: number;
  shock_magnitude: number;
  shock_duration: number;
  shock_start: number;
  tariff: number;
  route_capacity: number;
  storage_cap: number;
  demand_elasticity: number;
  agent_type: 'heuristic' | 'rnn';
}

export const DEFAULT_PARAMS: SimulationParams = {
  seed: 7,
  n_firms: 3,
  horizon: 36,
  shock_magnitude: 0.4,
  shock_duration: 8,
  shock_start: 10,
  tariff: 0.05,
  route_capacity: 1.0,
  storage_cap: 1.0,
  demand_elasticity: 1.2,
  agent_type: 'heuristic',
};

export const PRESETS = {
  baseline: {
    name: 'Baseline',
    description: 'Standard supply shock scenario',
    params: DEFAULT_PARAMS,
    demoFile: 'baseline.json',
  },
  quick_test: {
    name: 'Quick Test',
    description: 'Fast simulation with minimal horizon',
    params: {
      ...DEFAULT_PARAMS,
      horizon: 20,
      shock_duration: 5,
    },
    demoFile: 'baseline.json',
  },
  severe_shock: {
    name: 'Severe Shock',
    description: 'High magnitude, long duration shock',
    params: {
      ...DEFAULT_PARAMS,
      shock_magnitude: 0.7,
      shock_duration: 15,
      shock_start: 5,
    },
    demoFile: 'baseline.json',
  },
  tariff_hike: {
    name: 'Tariff Hike',
    description: 'High tariff protectionist policy',
    params: {
      ...DEFAULT_PARAMS,
      tariff: 0.25,
      shock_magnitude: 0.3,
    },
    demoFile: 'baseline.json',
  },
  route_disruption: {
    name: 'Route Disruption',
    description: 'Severe logistics constraint',
    params: {
      ...DEFAULT_PARAMS,
      route_capacity: 0.4,
      shock_magnitude: 0.5,
    },
    demoFile: 'baseline.json',
  },
  rnn_test: {
    name: 'RNN Test',
    description: 'RNN agent behavior test',
    params: {
      ...DEFAULT_PARAMS,
      agent_type: 'rnn' as const,
    },
    demoFile: 'rnn_test.json',
  },
};
