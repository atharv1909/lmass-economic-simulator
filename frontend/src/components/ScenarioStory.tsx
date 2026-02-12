import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, TrendingUp, Users, Shield, Package, Truck, Sparkles, Activity } from 'lucide-react';
import type { SimulationResult } from '@/types/simulation';

interface ScenarioStoryProps {
  data: SimulationResult;
}

interface StoryItem {
  icon: React.ReactNode;
  text: string;
  severity: 'low' | 'medium' | 'high';
  gradient: string;
}

export function ScenarioStory({ data }: ScenarioStoryProps) {
  const stories = generateStories(data);

  if (stories.length === 0) {
    return null;
  }

  return (
    <Card className="relative overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-red-500/5" />
      
      <CardHeader className="relative pb-3">
        <CardTitle className="text-lg flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500/30 rounded-lg blur-md" />
            <Sparkles className="relative h-5 w-5 text-amber-500" />
          </div>
          <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent font-bold">
            Scenario Analysis
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className="grid gap-3">
          {stories.map((story, i) => (
            <div 
              key={i} 
              className={`flex items-start gap-4 p-4 rounded-xl backdrop-blur-sm border transition-all duration-300 hover:scale-[1.01] hover:shadow-lg ${
                story.severity === 'high' 
                  ? 'bg-gradient-to-r from-rose-500/10 to-red-500/10 border-rose-200 dark:border-rose-800/50 hover:shadow-rose-500/10' 
                  : story.severity === 'medium'
                  ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-200 dark:border-amber-800/50 hover:shadow-amber-500/10'
                  : 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-200 dark:border-emerald-800/50 hover:shadow-emerald-500/10'
              }`}
            >
              <div className={`flex-shrink-0 p-2.5 rounded-lg bg-gradient-to-br ${story.gradient} text-white shadow-lg`}>
                {story.icon}
              </div>
              <p className="text-sm leading-relaxed pt-1">{story.text}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function generateStories(data: SimulationResult): StoryItem[] {
  const stories: StoryItem[] = [];
  const { config, metrics, market } = data;

  // Shock severity story
  if (config.shock.magnitude > 0.5) {
    stories.push({
      icon: <AlertTriangle className="h-4 w-4" />,
      text: `Severe supply shock (${(config.shock.magnitude * 100).toFixed(0)}% magnitude) starting at timestep ${config.shock.start} lasting ${config.shock.duration} periods. Expect significant market disruption.`,
      severity: 'high',
      gradient: 'from-rose-500 to-red-500',
    });
  } else if (config.shock.magnitude > 0.2) {
    stories.push({
      icon: <AlertTriangle className="h-4 w-4" />,
      text: `Moderate supply shock (${(config.shock.magnitude * 100).toFixed(0)}% magnitude) will cause temporary price pressure.`,
      severity: 'medium',
      gradient: 'from-amber-500 to-orange-500',
    });
  }

  // Price spike story
  const maxPrice = Math.max(...market.price_index);
  const minPrice = Math.min(...market.price_index);
  const priceSpike = (maxPrice - minPrice) / minPrice;

  if (priceSpike > 0.5) {
    stories.push({
      icon: <TrendingUp className="h-4 w-4" />,
      text: `Significant price volatility detected (${(priceSpike * 100).toFixed(0)}% increase). Prices peaked at ${maxPrice.toFixed(1)} due to supply constraints.`,
      severity: priceSpike > 1 ? 'high' : 'medium',
      gradient: priceSpike > 1 ? 'from-rose-500 to-red-500' : 'from-amber-500 to-orange-500',
    });
  }

  // Cartel story
  if (metrics.cartel_likelihood > 0.5) {
    stories.push({
      icon: <Users className="h-4 w-4" />,
      text: `High cartel likelihood (${(metrics.cartel_likelihood * 100).toFixed(0)}%) - firms may be coordinating prices. Monitor for anti-competitive behavior.`,
      severity: 'high',
      gradient: 'from-rose-500 to-red-500',
    });
  } else if (metrics.cartel_likelihood > 0.2) {
    stories.push({
      icon: <Users className="h-4 w-4" />,
      text: `Elevated cartel signals (${(metrics.cartel_likelihood * 100).toFixed(0)}%) suggest potential tacit collusion.`,
      severity: 'medium',
      gradient: 'from-amber-500 to-orange-500',
    });
  }

  // Tariff story
  if (config.rules.tariff > 0.15) {
    stories.push({
      icon: <Shield className="h-4 w-4" />,
      text: `High tariff rate (${(config.rules.tariff * 100).toFixed(0)}%) creates trade barriers and may inflate domestic prices.`,
      severity: config.rules.tariff > 0.3 ? 'high' : 'medium',
      gradient: config.rules.tariff > 0.3 ? 'from-rose-500 to-red-500' : 'from-amber-500 to-orange-500',
    });
  }

  // Route capacity story
  if (config.rules.route_capacity < 0.5) {
    stories.push({
      icon: <Truck className="h-4 w-4" />,
      text: `Severe logistics constraint (capacity at ${(config.rules.route_capacity * 100).toFixed(0)}%) limits supply chain throughput.`,
      severity: 'high',
      gradient: 'from-rose-500 to-red-500',
    });
  } else if (config.rules.route_capacity < 0.8) {
    stories.push({
      icon: <Truck className="h-4 w-4" />,
      text: `Reduced route capacity (${(config.rules.route_capacity * 100).toFixed(0)}%) may cause delivery bottlenecks.`,
      severity: 'medium',
      gradient: 'from-amber-500 to-orange-500',
    });
  }

  // Storage story
  if (config.rules.storage_cap < 0.8) {
    stories.push({
      icon: <Package className="h-4 w-4" />,
      text: `Limited storage capacity (${(config.rules.storage_cap * 100).toFixed(0)}%) restricts inventory buffering against shocks.`,
      severity: 'medium',
      gradient: 'from-amber-500 to-orange-500',
    });
  }

  // Stability story
  if (metrics.stability < 0.5) {
    stories.push({
      icon: <Activity className="h-4 w-4" />,
      text: `Market instability detected (stability score: ${(metrics.stability * 100).toFixed(0)}%). High volatility expected.`,
      severity: 'high',
      gradient: 'from-rose-500 to-red-500',
    });
  }

  return stories;
}
