import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MetricCards } from './MetricCards';
import { TrendingUp, Users, ArrowRight, Trophy } from 'lucide-react';
import type { SimulationResult } from '@/types/simulation';

interface CompareViewProps {
  baseline: SimulationResult;
  learned: SimulationResult;
  baselineName?: string;
  learnedName?: string;
}

const COLORS = {
  baseline: '#3b82f6',
  learned: '#10b981',
};

export function CompareView({ 
  baseline, 
  learned, 
  baselineName = 'Baseline', 
  learnedName = 'Learned' 
}: CompareViewProps) {
  // Safely create comparison data
  const comparisonData = useMemo(() => {
    if (!baseline?.t || !learned?.t) return [];
    
    const maxLength = Math.max(baseline.t.length, learned.t.length);
    const data = [];
    
    for (let i = 0; i < maxLength; i++) {
      const point: any = { t: i };
      
      if (i < baseline.t.length && baseline.market?.price_index?.[i] !== undefined) {
        point[`${baselineName} Price`] = baseline.market.price_index[i];
      }
      if (i < baseline.t.length && baseline.cartel?.score_t?.[i] !== undefined) {
        point[`${baselineName} Cartel`] = baseline.cartel.score_t[i];
      }
      
      if (i < learned.t.length && learned.market?.price_index?.[i] !== undefined) {
        point[`${learnedName} Price`] = learned.market.price_index[i];
      }
      if (i < learned.t.length && learned.cartel?.score_t?.[i] !== undefined) {
        point[`${learnedName} Cartel`] = learned.cartel.score_t[i];
      }
      
      data.push(point);
    }
    
    return data;
  }, [baseline, learned, baselineName, learnedName]);

  // Safely create metric comparison
  const metricComparison = useMemo(() => {
    if (!baseline?.metrics || !learned?.metrics) return [];
    
    return [
      {
        label: 'Stability',
        baseline: baseline.metrics.stability ?? 0,
        learned: learned.metrics.stability ?? 0,
        better: (learned.metrics.stability ?? 0) >= (baseline.metrics.stability ?? 0) ? 'learned' : 'baseline',
        isHigherBetter: true,
      },
      {
        label: 'Cartel Likelihood',
        baseline: baseline.metrics.cartel_likelihood ?? 0,
        learned: learned.metrics.cartel_likelihood ?? 0,
        better: (learned.metrics.cartel_likelihood ?? 0) <= (baseline.metrics.cartel_likelihood ?? 0) ? 'learned' : 'baseline',
        isHigherBetter: false,
      },
      {
        label: 'Welfare',
        baseline: baseline.metrics.welfare ?? 0,
        learned: learned.metrics.welfare ?? 0,
        better: (learned.metrics.welfare ?? 0) >= (baseline.metrics.welfare ?? 0) ? 'learned' : 'baseline',
        isHigherBetter: true,
      },
      {
        label: 'Adapt Speed',
        baseline: baseline.metrics.adapt_speed ?? 0,
        learned: learned.metrics.adapt_speed ?? 0,
        better: (learned.metrics.adapt_speed ?? 0) <= (baseline.metrics.adapt_speed ?? 0) ? 'learned' : 'baseline',
        isHigherBetter: false,
      },
    ];
  }, [baseline, learned]);

  const winner = useMemo(() => {
    if (metricComparison.length === 0) return 'tie';
    const learnedWins = metricComparison.filter(m => m.better === 'learned').length;
    const baselineWins = metricComparison.filter(m => m.better === 'baseline').length;
    if (learnedWins > baselineWins) return 'learned';
    if (baselineWins > learnedWins) return 'baseline';
    return 'tie';
  }, [metricComparison]);

  // Check if we have valid data
  const hasValidData = baseline && learned && baseline.metrics && learned.metrics;

  if (!hasValidData) {
    return (
      <Card className="p-12 text-center backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
        <div className="relative inline-flex mb-6">
          <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl" />
          <TrendingUp className="relative h-16 w-16 text-amber-500" />
        </div>
        <h3 className="text-xl font-semibold mb-3">Loading Comparison...</h3>
        <p className="text-muted-foreground">Please wait while we prepare the data</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Winner Banner */}
      <Card className={`overflow-hidden backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-xl ${
        winner === 'learned' 
          ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10' 
          : winner === 'baseline'
          ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10'
          : 'bg-gradient-to-r from-amber-500/10 to-orange-500/10'
      }`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-4">
            <Trophy className={`h-10 w-10 ${
              winner === 'learned' ? 'text-emerald-500' : 
              winner === 'baseline' ? 'text-blue-500' : 
              'text-amber-500'
            }`} />
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Winner</p>
              <p className={`text-3xl font-bold ${
                winner === 'learned' ? 'text-emerald-600' : 
                winner === 'baseline' ? 'text-blue-600' : 
                'text-amber-600'
              }`}>
                {winner === 'learned' ? learnedName : winner === 'baseline' ? baselineName : 'Tie'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Side-by-side metric cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {baselineName}
            </h3>
          </div>
          <MetricCards metrics={baseline.metrics} />
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              {learnedName}
            </h3>
          </div>
          <MetricCards metrics={learned.metrics} />
        </div>
      </div>

      {/* Metric comparison table */}
      <Card className="overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-slate-100/50 to-slate-200/50 dark:from-slate-800/50 dark:to-slate-700/50 border-b border-slate-200/50 dark:border-slate-700/50">
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-purple-500" />
            Metric Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                  <th className="text-left py-4 px-6 font-semibold">Metric</th>
                  <th className="text-right py-4 px-6 font-semibold text-blue-600">{baselineName}</th>
                  <th className="text-right py-4 px-6 font-semibold text-emerald-600">{learnedName}</th>
                  <th className="text-center py-4 px-6 font-semibold">Difference</th>
                  <th className="text-center py-4 px-6 font-semibold">Winner</th>
                </tr>
              </thead>
              <tbody>
                {metricComparison.map((metric, index) => {
                  const diff = metric.learned - metric.baseline;
                  const diffPercent = metric.baseline !== 0 ? ((diff / metric.baseline) * 100) : 0;
                  const isPositive = metric.isHigherBetter ? diff > 0 : diff < 0;
                  
                  return (
                    <tr 
                      key={metric.label} 
                      className={`border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${
                        index % 2 === 0 ? 'bg-white/50 dark:bg-slate-900/50' : ''
                      }`}
                    >
                      <td className="py-4 px-6 font-medium">{metric.label}</td>
                      <td className="text-right py-4 px-6 font-mono text-sm">
                        <span className="px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          {metric.label === 'Welfare' 
                            ? Math.round(metric.baseline).toLocaleString()
                            : metric.baseline.toFixed(3)}
                        </span>
                      </td>
                      <td className="text-right py-4 px-6 font-mono text-sm">
                        <span className="px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                          {metric.label === 'Welfare'
                            ? Math.round(metric.learned).toLocaleString()
                            : metric.learned.toFixed(3)}
                        </span>
                      </td>
                      <td className="text-center py-4 px-6 font-mono text-sm">
                        <span className={`px-2 py-1 rounded-lg ${
                          isPositive 
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' 
                            : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'
                        }`}>
                          {diff > 0 ? '+' : ''}{metric.label === 'Welfare' ? Math.round(diff).toLocaleString() : diff.toFixed(3)}
                          <span className="text-xs ml-1 opacity-70">
                            ({diffPercent > 0 ? '+' : ''}{diffPercent.toFixed(1)}%)
                          </span>
                        </span>
                      </td>
                      <td className="text-center py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                          metric.better === 'learned' 
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25' 
                            : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25'
                        }`}>
                          {metric.better === 'learned' ? (
                            <><Users className="h-3 w-3" /> {learnedName}</>
                          ) : (
                            <><TrendingUp className="h-3 w-3" /> {baselineName}</>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Overlay charts */}
      {comparisonData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-slate-200/50 dark:border-slate-700/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Price Index Comparison
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={comparisonData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis 
                    dataKey="t" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    label={{ value: 'Timestep', position: 'insideBottom', offset: -10, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                    }}
                  />
                  <Legend iconType="circle" />
                  <Line
                    type="monotone"
                    dataKey={`${baselineName} Price`}
                    stroke={COLORS.baseline}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                  <Line
                    type="monotone"
                    dataKey={`${learnedName} Price`}
                    stroke={COLORS.learned}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-rose-500/10 to-orange-500/10 border-b border-slate-200/50 dark:border-slate-700/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-rose-500" />
                Cartel Score Comparison
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={comparisonData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis 
                    dataKey="t" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    label={{ value: 'Timestep', position: 'insideBottom', offset: -10, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} domain={[0, 1]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                    }}
                  />
                  <Legend iconType="circle" />
                  <Line
                    type="monotone"
                    dataKey={`${baselineName} Cartel`}
                    stroke={COLORS.baseline}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                  <Line
                    type="monotone"
                    dataKey={`${learnedName} Cartel`}
                    stroke={COLORS.learned}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
