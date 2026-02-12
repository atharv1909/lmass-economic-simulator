import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, SlidersHorizontal, Hash, Brain } from 'lucide-react';
import type { SimulationParams } from '@/types/simulation';

interface ParameterPanelProps {
  params: SimulationParams;
  onParamsChange: (params: SimulationParams) => void;
  disabled?: boolean;
}

interface SliderConfig {
  key: keyof SimulationParams;
  label: string;
  min: number;
  max: number;
  step: number;
  tooltip: string;
  icon: React.ReactNode;
  color: string;
}

const SLIDERS: SliderConfig[] = [
  {
    key: 'shock_magnitude',
    label: 'Shock Magnitude',
    min: 0,
    max: 1,
    step: 0.05,
    tooltip: 'Intensity of the supply shock (0 = no shock, 1 = complete supply halt)',
    icon: <span className="text-rose-500">!</span>,
    color: 'from-rose-500 to-red-500',
  },
  {
    key: 'shock_duration',
    label: 'Shock Duration',
    min: 1,
    max: 30,
    step: 1,
    tooltip: 'Number of timesteps the shock lasts',
    icon: <span className="text-amber-500">⏱</span>,
    color: 'from-amber-500 to-orange-500',
  },
  {
    key: 'shock_start',
    label: 'Shock Start',
    min: 0,
    max: 50,
    step: 1,
    tooltip: 'Timestep when the shock begins',
    icon: <span className="text-blue-500">▶</span>,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    key: 'tariff',
    label: 'Tariff Rate',
    min: 0,
    max: 1,
    step: 0.01,
    tooltip: 'Import tariff rate (0 = free trade, 1 = complete ban)',
    icon: <span className="text-purple-500">$</span>,
    color: 'from-purple-500 to-violet-500',
  },
  {
    key: 'route_capacity',
    label: 'Route Capacity',
    min: 0.1,
    max: 2,
    step: 0.1,
    tooltip: 'Logistics route capacity multiplier (0.1 = severe constraint, 2 = abundant)',
    icon: <span className="text-emerald-500">🚚</span>,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    key: 'storage_cap',
    label: 'Storage Capacity',
    min: 0.5,
    max: 3,
    step: 0.1,
    tooltip: 'Inventory storage capacity multiplier',
    icon: <span className="text-cyan-500">📦</span>,
    color: 'from-cyan-500 to-blue-500',
  },
  {
    key: 'demand_elasticity',
    label: 'Demand Elasticity',
    min: 0.1,
    max: 3,
    step: 0.1,
    tooltip: 'Price sensitivity of demand (0.1 = inelastic, 3 = highly elastic)',
    icon: <span className="text-pink-500">📊</span>,
    color: 'from-pink-500 to-rose-500',
  },
  {
    key: 'horizon',
    label: 'Simulation Horizon',
    min: 10,
    max: 200,
    step: 5,
    tooltip: 'Total number of timesteps to simulate',
    icon: <span className="text-indigo-500">📈</span>,
    color: 'from-indigo-500 to-purple-500',
  },
];

export function ParameterPanel({ params, onParamsChange, disabled }: ParameterPanelProps) {
  const [localParams, setLocalParams] = useState(params);

  const handleSliderChange = (key: keyof SimulationParams, value: number) => {
    const newParams = { ...localParams, [key]: value };
    setLocalParams(newParams);
    onParamsChange(newParams);
  };

  const handleInputChange = (key: keyof SimulationParams, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      const newParams = { ...localParams, [key]: numValue };
      setLocalParams(newParams);
      onParamsChange(newParams);
    }
  };

  const handleSelectChange = (key: keyof SimulationParams, value: string) => {
    const newParams = { ...localParams, [key]: value };
    setLocalParams(newParams);
    onParamsChange(newParams);
  };

  return (
    <TooltipProvider>
      <div className="space-y-5">
        {SLIDERS.map((slider) => (
          <div key={slider.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="text-xs">{slider.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
                <Label className="text-sm font-medium">{slider.label}</Label>
              </div>
              <span className={`text-sm font-mono px-2 py-0.5 rounded-md bg-gradient-to-r ${slider.color} text-white font-bold`}>
                {localParams[slider.key]}
              </span>
            </div>
            <div className="relative">
              <input
                type="range"
                min={slider.min}
                max={slider.max}
                step={slider.step}
                value={localParams[slider.key] as number}
                onChange={(e) => handleSliderChange(slider.key, parseFloat(e.target.value))}
                disabled={disabled}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${((localParams[slider.key] as number - slider.min) / (slider.max - slider.min)) * 100}%, hsl(var(--muted)) ${((localParams[slider.key] as number - slider.min) / (slider.max - slider.min)) * 100}%, hsl(var(--muted)) 100%)`
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{slider.min}</span>
              <span>{slider.max}</span>
            </div>
          </div>
        ))}

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Hash className="h-4 w-4 text-blue-500" />
              Number of Firms
            </Label>
            <Select
              value={String(localParams.n_firms)}
              onValueChange={(value) => handleInputChange('n_firms', value)}
              disabled={disabled}
            >
              <SelectTrigger className="bg-white/50 dark:bg-slate-800/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} Firms
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-500" />
              Agent Type
            </Label>
            <Select
              value={localParams.agent_type}
              onValueChange={(value: 'heuristic' | 'rnn') => handleSelectChange('agent_type', value)}
              disabled={disabled}
            >
              <SelectTrigger className="bg-white/50 dark:bg-slate-800/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="heuristic">Heuristic</SelectItem>
                <SelectItem value="rnn">RNN</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
          <Label className="text-sm font-medium flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-emerald-500" />
            Random Seed
          </Label>
          <Input
            type="number"
            value={localParams.seed}
            onChange={(e) => handleInputChange('seed', e.target.value)}
            disabled={disabled}
            min={0}
            max={999999}
            className="bg-white/50 dark:bg-slate-800/50"
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
