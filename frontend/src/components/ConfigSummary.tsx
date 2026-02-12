import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Code, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { SimulationConfig } from '@/types/simulation';

interface ConfigSummaryProps {
  config: SimulationConfig;
}

export function ConfigSummary({ config }: ConfigSummaryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setCopied(true);
    toast.success('Configuration copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const configItems = [
    { label: 'Number of Firms', value: config.n_firms, icon: '🏢' },
    { label: 'Horizon', value: config.horizon, icon: '📅' },
    { label: 'Seed', value: config.seed ?? 'N/A', icon: '🎲' },
    { label: 'Shock Magnitude', value: `${(config.shock.magnitude * 100).toFixed(0)}%`, icon: '⚡' },
    { label: 'Shock Duration', value: `${config.shock.duration} timesteps`, icon: '⏱️' },
    { label: 'Shock Start', value: `Timestep ${config.shock.start}`, icon: '▶️' },
    { label: 'Tariff', value: `${(config.rules.tariff * 100).toFixed(0)}%`, icon: '💰' },
    { label: 'Route Capacity', value: config.rules.route_capacity, icon: '🚚' },
    { label: 'Storage Cap', value: config.rules.storage_cap, icon: '📦' },
    { label: 'Demand Elasticity', value: config.rules.demand_elasticity, icon: '📊' },
    { label: 'Agent Type', value: config.agent?.type ?? 'heuristic', icon: '🤖' },
  ];

  return (
    <Card className="overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-0">
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent py-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 text-white shadow-lg">
                  <Code className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg font-semibold">Configuration Summary</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy();
                  }}
                  className="hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
              {configItems.map((item) => (
                <div 
                  key={item.label} 
                  className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">{item.label}</span>
                  </div>
                  <span className="text-lg font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-xl" />
              <pre className="relative p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto">
                <code>{JSON.stringify(config, null, 2)}</code>
              </pre>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
