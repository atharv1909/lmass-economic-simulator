import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Factory, ShoppingCart, Package, Users, Globe } from 'lucide-react';
import type { SimulationResult } from '@/types/simulation';

interface SimulationChartsProps {
  data: SimulationResult;
}

interface ChartDataPoint {
  t: number;
  [key: string]: number;
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
];

function prepareFirmData(
  t: number[],
  firmData: { [firmName: string]: number[] }
): ChartDataPoint[] {
  return t.map((timestep, i) => {
    const point: ChartDataPoint = { t: timestep };
    Object.entries(firmData).forEach(([firmName, values]) => {
      point[firmName] = values[i];
    });
    return point;
  });
}

function prepareMarketData(data: SimulationResult): ChartDataPoint[] {
  return data.t.map((timestep, i) => ({
    t: timestep,
    'Price Index': data.market.price_index[i],
    'Demand': data.market.demand[i],
    'Supply': data.market.supply_true[i],
  }));
}

function prepareCartelData(data: SimulationResult): ChartDataPoint[] {
  return data.t.map((timestep, i) => ({
    t: timestep,
    'Cartel Score': data.cartel.score_t[i],
  }));
}

interface MultiLineChartProps {
  data: ChartDataPoint[];
  dataKeys: string[];
  yAxisLabel?: string;
}

function MultiLineChart({ data, dataKeys, yAxisLabel }: MultiLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
        <XAxis 
          dataKey="t" 
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={{ stroke: 'hsl(var(--border))' }}
          tickLine={{ stroke: 'hsl(var(--border))' }}
          label={{ value: 'Timestep', position: 'insideBottom', offset: -10, fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis 
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={{ stroke: 'hsl(var(--border))' }}
          tickLine={{ stroke: 'hsl(var(--border))' }}
          label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '12px',
            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
          }}
          labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
        />
        <Legend 
          wrapperStyle={{ paddingTop: '15px' }}
          iconType="circle"
        />
        {dataKeys.map((key, i) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 6, strokeWidth: 0, fill: COLORS[i % COLORS.length] }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SimulationCharts({ data }: SimulationChartsProps) {
  const pricesData = useMemo(() => prepareFirmData(data.t, data.prices), [data]);
  const productionData = useMemo(() => prepareFirmData(data.t, data.production), [data]);
  const salesData = useMemo(() => prepareFirmData(data.t, data.sales), [data]);
  const inventoryData = useMemo(() => prepareFirmData(data.t, data.inventory), [data]);
  const marketData = useMemo(() => prepareMarketData(data), [data]);
  const cartelData = useMemo(() => prepareCartelData(data), [data]);

  const firmNames = Object.keys(data.prices);

  const tabItems = [
    { value: 'prices', label: 'Prices', icon: TrendingUp, color: 'text-blue-500', title: 'Firm Prices Over Time' },
    { value: 'production', label: 'Production', icon: Factory, color: 'text-emerald-500', title: 'Firm Production Over Time' },
    { value: 'sales', label: 'Sales', icon: ShoppingCart, color: 'text-amber-500', title: 'Firm Sales Over Time' },
    { value: 'inventory', label: 'Inventory', icon: Package, color: 'text-violet-500', title: 'Firm Inventory Over Time' },
    { value: 'cartel', label: 'Cartel', icon: Users, color: 'text-rose-500', title: 'Cartel Score Over Time' },
    { value: 'market', label: 'Market', icon: Globe, color: 'text-cyan-500', title: 'Market Indicators' },
  ];

  return (
    <Tabs defaultValue="prices" className="w-full">
      <TabsList className="grid grid-cols-3 md:grid-cols-6 gap-1 p-1.5 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50">
        {tabItems.map((item) => (
          <TabsTrigger 
            key={item.value} 
            value={item.value}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md transition-all duration-300"
          >
            <item.icon className={`h-4 w-4 ${item.color}`} />
            <span className="hidden sm:inline text-sm font-medium">{item.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="prices" className="mt-6">
        <ChartCard title="Firm Prices Over Time" icon={TrendingUp} gradient="from-blue-500 to-cyan-500">
          <MultiLineChart data={pricesData} dataKeys={firmNames} yAxisLabel="Price" />
        </ChartCard>
      </TabsContent>

      <TabsContent value="production" className="mt-6">
        <ChartCard title="Firm Production Over Time" icon={Factory} gradient="from-emerald-500 to-teal-500">
          <MultiLineChart data={productionData} dataKeys={firmNames} yAxisLabel="Production Volume" />
        </ChartCard>
      </TabsContent>

      <TabsContent value="sales" className="mt-6">
        <ChartCard title="Firm Sales Over Time" icon={ShoppingCart} gradient="from-amber-500 to-orange-500">
          <MultiLineChart data={salesData} dataKeys={firmNames} yAxisLabel="Sales Volume" />
        </ChartCard>
      </TabsContent>

      <TabsContent value="inventory" className="mt-6">
        <ChartCard title="Firm Inventory Over Time" icon={Package} gradient="from-violet-500 to-purple-500">
          <MultiLineChart data={inventoryData} dataKeys={firmNames} yAxisLabel="Inventory Level" />
        </ChartCard>
      </TabsContent>

      <TabsContent value="cartel" className="mt-6">
        <ChartCard title="Cartel Score Over Time" icon={Users} gradient="from-rose-500 to-red-500">
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={cartelData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
              <defs>
                <linearGradient id="cartelGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis 
                dataKey="t" 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                label={{ value: 'Timestep', position: 'insideBottom', offset: -10, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                domain={[0, 1]}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                label={{ value: 'Cartel Score', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                }}
              />
              <Area
                type="monotone"
                dataKey="Cartel Score"
                stroke="#ef4444"
                strokeWidth={2.5}
                fill="url(#cartelGradient)"
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </TabsContent>

      <TabsContent value="market" className="mt-6">
        <ChartCard title="Market Indicators" icon={Globe} gradient="from-cyan-500 to-blue-500">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={marketData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis 
                dataKey="t" 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                label={{ value: 'Timestep', position: 'insideBottom', offset: -10, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                label={{ value: 'Price Index', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                label={{ value: 'Volume', angle: 90, position: 'insideRight', fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '15px' }} iconType="circle" />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="Price Index"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="Demand"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="Supply"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </TabsContent>
    </Tabs>
  );
}

interface ChartCardProps {
  title: string;
  icon: React.ElementType;
  gradient: string;
  children: React.ReactNode;
}

function ChartCard({ title, icon: Icon, gradient, children }: ChartCardProps) {
  return (
    <Card className="overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50 shadow-xl shadow-slate-200/20 dark:shadow-slate-900/20">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient} text-white shadow-lg`}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="font-semibold">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
