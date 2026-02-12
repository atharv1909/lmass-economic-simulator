import { useState, useEffect, useCallback } from 'react';
import { 
  Play, 
  RefreshCw, 
  Activity, 
  Database, 
  Server, 
  XCircle,
  GitCompare,
  Settings2,
  BarChart3,
  Zap,
  TrendingUp,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ParameterPanel } from '@/components/ParameterPanel';
import { MetricCards } from '@/components/MetricCards';
import { SimulationCharts } from '@/components/SimulationCharts';
import { ScenarioStory } from '@/components/ScenarioStory';
import { ConfigSummary } from '@/components/ConfigSummary';
import { CompareView } from '@/components/CompareView';
import { apiService } from '@/services/api';
import { 
  DEFAULT_PARAMS, 
  PRESETS, 
  type SimulationParams, 
  type SimulationResult, 
  type SimulationMode,
  type HealthStatus 
} from '@/types/simulation';

function App() {
  // State
  const [mode, setMode] = useState<SimulationMode>('demo');
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  const [selectedPreset, setSelectedPreset] = useState<string>('baseline');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [compareResult, setCompareResult] = useState<{
    baseline: SimulationResult;
    learned: SimulationResult;
  } | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [activeTab, setActiveTab] = useState('results');

  // Check API health on mount
  useEffect(() => {
    checkHealth();
    // Load baseline demo data on initial load
    loadDemoDataDirect('baseline.json');
  }, []);

  const checkHealth = async () => {
    const status = await apiService.checkHealth();
    setHealth(status);
  };

  // Direct data loading without state manipulation (for internal use)
  const loadDemoDataDirect = async (filename: string) => {
    try {
      const data = await apiService.loadDemoData(filename);
      setResult(data);
    } catch (error) {
      console.error(`Failed to load ${filename}:`, error);
    }
  };

  // User-triggered data loading with toast
  const loadDemoData = async (filename: string) => {
    try {
      setIsLoading(true);
      const data = await apiService.loadDemoData(filename);
      setResult(data);
      toast.success(`Loaded ${filename}`);
    } catch (error) {
      toast.error(`Failed to load ${filename}`);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunSimulation = async () => {
    setIsLoading(true);
    try {
      if (mode === 'live') {
        try {
          const data = await apiService.runSimulation(params);
          setResult(data);
          toast.success('Simulation completed successfully');
        } catch (error) {
          console.warn('Live API failed, falling back to demo mode:', error);
          toast.error('Live backend unavailable, falling back to demo mode');
          setMode('demo');
          // Fall back to demo
          const demoFile = params.agent_type === 'rnn' ? 'rnn_test.json' : 'baseline.json';
          const data = await apiService.loadDemoData(demoFile);
          setResult(data);
        }
      } else {
        // Demo mode - load appropriate file based on params
        const demoFile = params.agent_type === 'rnn' ? 'rnn_test.json' : 'baseline.json';
        const data = await apiService.loadDemoData(demoFile);
        setResult(data);
        toast.success(`Loaded ${demoFile}`);
      }
    } catch (error) {
      toast.error('Simulation failed');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompare = async () => {
    setIsLoading(true);
    try {
      if (mode === 'live') {
        try {
          const baselineParams = { ...params, agent_type: 'heuristic' as const };
          const learnedParams = { ...params, agent_type: 'rnn' as const };
          const data = await apiService.compareSimulations(baselineParams, learnedParams);
          setCompareResult(data);
          setActiveTab('compare');
          toast.success('Comparison completed');
        } catch (error) {
          console.warn('Live compare failed, using demo data:', error);
          toast.error('Compare endpoint unavailable, using demo data');
          // Fall back to demo comparison - use direct fetch to avoid state conflicts
          const [baseline, learned] = await Promise.all([
            apiService.loadDemoData('baseline.json'),
            apiService.loadDemoData('rnn_test.json'),
          ]);
          setCompareResult({ baseline, learned });
          setActiveTab('compare');
        }
      } else {
        // Demo mode - compare the two demo files
        const [baseline, learned] = await Promise.all([
          apiService.loadDemoData('baseline.json'),
          apiService.loadDemoData('rnn_test.json'),
        ]);
        setCompareResult({ baseline, learned });
        setActiveTab('compare');
        toast.success('Demo comparison loaded');
      }
    } catch (error) {
      toast.error('Failed to run comparison');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetChange = (presetKey: string) => {
    setSelectedPreset(presetKey);
    const preset = PRESETS[presetKey as keyof typeof PRESETS];
    if (preset) {
      setParams(preset.params);
      if (mode === 'demo') {
        loadDemoData(preset.demoFile);
      }
    }
  };

  const handleParamsChange = useCallback((newParams: SimulationParams) => {
    setParams(newParams);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      {/* Glass Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-b border-white/20 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur-lg opacity-50" />
                <div className="relative bg-gradient-to-br from-blue-600 to-purple-600 p-3 rounded-xl">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                  Economic Simulator
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Zap className="h-3 w-3 text-amber-500" />
                  Policy testing under supply shocks
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Health Badge */}
              <div className="flex items-center gap-2">
                {health ? (
                  <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-lg shadow-emerald-500/25">
                    <span className="relative flex h-2 w-2 mr-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                    </span>
                    API Online
                  </Badge>
                ) : (
                  <Badge className="bg-gradient-to-r from-red-500 to-rose-500 text-white border-0 shadow-lg shadow-red-500/25">
                    <XCircle className="h-3 w-3 mr-1" />
                    API Offline
                  </Badge>
                )}
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center gap-3 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-2 border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-500" />
                  <Label htmlFor="mode-toggle" className="text-sm cursor-pointer font-medium">
                    Demo
                  </Label>
                </div>
                <Switch
                  id="mode-toggle"
                  checked={mode === 'live'}
                  onCheckedChange={(checked) => setMode(checked ? 'live' : 'demo')}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-purple-500"
                />
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-purple-500" />
                  <Label htmlFor="mode-toggle" className="text-sm cursor-pointer font-medium">
                    Live
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar - Controls */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-6">
            {/* Presets */}
            <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50 shadow-xl shadow-slate-200/20 dark:shadow-slate-900/20 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 px-4 py-3 border-b border-slate-200/50 dark:border-slate-700/50">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  Scenario Presets
                </Label>
              </div>
              <CardContent className="pt-4">
                <div className="flex flex-col gap-2">
                  {Object.entries(PRESETS).map(([key, preset]) => (
                    <Button
                      key={key}
                      variant={selectedPreset === key ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePresetChange(key)}
                      className={`justify-start text-left h-auto py-3 px-4 transition-all duration-300 ${
                        selectedPreset === key 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 shadow-lg shadow-blue-500/25' 
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex flex-col items-start min-w-0 flex-1">
                          <span className="text-sm font-semibold truncate">{preset.name}</span>
                          <span className="text-xs opacity-70 truncate w-full">
                            {preset.description}
                          </span>
                        </div>
                        {selectedPreset === key && (
                          <div className="ml-2 w-2 h-2 rounded-full bg-white animate-pulse flex-shrink-0" />
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Parameter Panel */}
            <div className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl shadow-slate-200/20 dark:shadow-slate-900/20 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-4 py-3 border-b border-slate-200/50 dark:border-slate-700/50">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-emerald-500" />
                  Parameters
                </Label>
              </div>
              <div className="p-4">
                <ParameterPanel
                  params={params}
                  onParamsChange={handleParamsChange}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleRunSimulation}
                disabled={isLoading}
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/30"
              >
                {isLoading ? (
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Play className="h-5 w-5 mr-2" />
                )}
                {isLoading ? 'Running Simulation...' : 'Run Simulation'}
              </Button>
              
              <Button
                onClick={handleCompare}
                disabled={isLoading}
                variant="outline"
                size="lg"
                className="w-full border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 hover:scale-[1.02]"
              >
                <GitCompare className="h-5 w-5 mr-2" />
                Compare Agents
              </Button>
            </div>
          </div>

          {/* Right Content - Results */}
          <div className="lg:col-span-8 xl:col-span-9">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-6 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                <TabsTrigger 
                  value="results" 
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-lg transition-all duration-300"
                >
                  <Activity className="h-4 w-4" />
                  Results
                </TabsTrigger>
                <TabsTrigger 
                  value="compare" 
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-lg transition-all duration-300"
                >
                  <GitCompare className="h-4 w-4" />
                  Compare
                </TabsTrigger>
                <TabsTrigger 
                  value="settings" 
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-lg transition-all duration-300"
                >
                  <Settings2 className="h-4 w-4" />
                  Config
                </TabsTrigger>
              </TabsList>

              <TabsContent value="results" className="space-y-6">
                {result ? (
                  <>
                    {/* Scenario Story */}
                    <ScenarioStory data={result} />

                    {/* Metric Cards */}
                    <MetricCards metrics={result.metrics} />

                    {/* Charts */}
                    <SimulationCharts data={result} />
                  </>
                ) : (
                  <Card className="p-16 text-center backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
                    <div className="relative inline-flex mb-6">
                      <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl" />
                      <Activity className="relative h-16 w-16 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">No Results Yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Run a simulation or select a preset scenario to visualize economic outcomes
                    </p>
                    <Button 
                      onClick={handleRunSimulation} 
                      disabled={isLoading}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Run Simulation
                    </Button>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="compare" className="space-y-6">
                {compareResult ? (
                  <CompareView
                    baseline={compareResult.baseline}
                    learned={compareResult.learned}
                    baselineName="Heuristic Agent"
                    learnedName="RNN Agent"
                  />
                ) : (
                  <Card className="p-16 text-center backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
                    <div className="relative inline-flex mb-6">
                      <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl" />
                      <GitCompare className="relative h-16 w-16 text-purple-500" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">No Comparison Yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Compare Heuristic vs RNN agent behaviors side-by-side
                    </p>
                    <Button 
                      onClick={handleCompare} 
                      disabled={isLoading}
                      variant="outline"
                      className="border-2"
                    >
                      <GitCompare className="h-4 w-4 mr-2" />
                      Compare Agents
                    </Button>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                {result ? (
                  <ConfigSummary config={result.config} />
                ) : (
                  <Card className="p-16 text-center backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
                    <div className="relative inline-flex mb-6">
                      <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl" />
                      <Settings2 className="relative h-16 w-16 text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">No Configuration</h3>
                    <p className="text-muted-foreground">
                      Run a simulation to view configuration details
                    </p>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* Glass Footer */}
      <footer className="mt-16 py-8 backdrop-blur-sm bg-white/50 dark:bg-slate-900/50 border-t border-white/20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-blue-500" />
            <span className="font-semibold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
              Multi-Agent Strategic Economic Simulator
            </span>
          </div>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <AlertTriangle className="h-3 w-3 text-amber-500" />
            Policy testing under supply shocks
            <span className="mx-2">•</span>
            Mode: <span className="font-medium text-foreground">{mode === 'live' ? 'Live API' : 'Demo Data'}</span>
            {health && (
              <>
                <span className="mx-2">•</span>
                API v{health.version}
              </>
            )}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
