import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity, Scale, Users, Zap, ArrowRight } from 'lucide-react';
import type { Metrics } from '@/types/simulation';

interface MetricCardsProps {
  metrics: Metrics;
}

interface MetricCard {
  title: string;
  value: number;
  formatted: string;
  icon: React.ReactNode;
  description: string;
  trend?: 'up' | 'down' | 'neutral';
  gradient: string;
  shadowColor: string;
}

export function MetricCards({ metrics }: MetricCardsProps) {
  const cards: MetricCard[] = [
    {
      title: 'Stability Score',
      value: metrics.stability,
      formatted: `${(metrics.stability * 100).toFixed(1)}%`,
      icon: <Activity className="h-5 w-5" />,
      description: 'Market stability index',
      trend: metrics.stability > 0.8 ? 'up' : metrics.stability > 0.5 ? 'neutral' : 'down',
      gradient: metrics.stability > 0.8 
        ? 'from-emerald-500 to-teal-500' 
        : metrics.stability > 0.5 
          ? 'from-amber-500 to-orange-500' 
          : 'from-rose-500 to-red-500',
      shadowColor: metrics.stability > 0.8 
        ? 'shadow-emerald-500/30' 
        : metrics.stability > 0.5 
          ? 'shadow-amber-500/30' 
          : 'shadow-rose-500/30',
    },
    {
      title: 'Cartel Likelihood',
      value: metrics.cartel_likelihood,
      formatted: `${(metrics.cartel_likelihood * 100).toFixed(1)}%`,
      icon: <Users className="h-5 w-5" />,
      description: 'Probability of collusion',
      trend: metrics.cartel_likelihood > 0.5 ? 'up' : 'down',
      gradient: metrics.cartel_likelihood > 0.5 
        ? 'from-rose-500 to-red-500' 
        : 'from-emerald-500 to-teal-500',
      shadowColor: metrics.cartel_likelihood > 0.5 
        ? 'shadow-rose-500/30' 
        : 'shadow-emerald-500/30',
    },
    {
      title: 'Welfare Score',
      value: metrics.welfare,
      formatted: metrics.welfare.toLocaleString('en-US', { maximumFractionDigits: 0 }),
      icon: <Scale className="h-5 w-5" />,
      description: 'Total economic welfare',
      trend: 'neutral',
      gradient: 'from-blue-500 to-indigo-500',
      shadowColor: 'shadow-blue-500/30',
    },
    {
      title: 'Adaptation Speed',
      value: metrics.adapt_speed,
      formatted: `${metrics.adapt_speed.toFixed(1)}`,
      icon: <Zap className="h-5 w-5" />,
      description: 'Timesteps to recover',
      trend: metrics.adapt_speed < 10 ? 'up' : metrics.adapt_speed < 20 ? 'neutral' : 'down',
      gradient: metrics.adapt_speed < 10 
        ? 'from-emerald-500 to-teal-500' 
        : metrics.adapt_speed < 20 
          ? 'from-amber-500 to-orange-500' 
          : 'from-rose-500 to-red-500',
      shadowColor: metrics.adapt_speed < 10 
        ? 'shadow-emerald-500/30' 
        : metrics.adapt_speed < 20 
          ? 'shadow-amber-500/30' 
          : 'shadow-rose-500/30',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card 
          key={card.title} 
          className="group relative overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* Gradient Background */}
          <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
          
          {/* Top Accent Bar */}
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`} />
          
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-lg ${card.shadowColor}`}>
                {card.icon}
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${
                card.trend === 'up' ? 'text-emerald-500' : 
                card.trend === 'down' ? 'text-rose-500' : 'text-slate-400'
              }`}>
                {card.trend === 'up' && <TrendingUp className="h-3 w-3" />}
                {card.trend === 'down' && <TrendingDown className="h-3 w-3" />}
                {card.trend !== 'neutral' && (card.trend === 'up' ? 'Good' : 'Warning')}
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{card.title}</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent`}>
                  {card.formatted}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </div>

            {/* Hover Arrow */}
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
              <ArrowRight className={`h-4 w-4 bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
