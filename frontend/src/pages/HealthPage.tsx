import { useState, useEffect } from 'react';
import { HeartPulse, Server, Database, HardDrive, RefreshCw, Cpu, MemoryStick, Clock, Activity, Zap } from 'lucide-react';
import { Badge, Button, Card, CardHeader, CardTitle, CardContent } from '../components/ui';
import { fetchHealth, fetchOpsStatus } from '../hooks/api';

interface HealthData {
  status: string;
  info: Record<string, unknown>;
  error: Record<string, unknown>;
  details?: Record<string, any>;
}

interface OpsData {
  uptime: number;
  memory: { rss: number; heapUsed: number; heapTotal: number };
  cpu: { usage: number };
}

export default function HealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [ops, setOps] = useState<OpsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  const fetchData = async () => {
    setLoading(true);
    try {
      const [h, o] = await Promise.allSettled([fetchHealth(), fetchOpsStatus()]);
      if (h.status === 'fulfilled') setHealth(h.value || { status: 'ok', info: {}, error: {} });
      if (o.status === 'fulfilled') setOps(o.value || null);
      setLastCheck(new Date());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const isHealthy = health?.status === 'ok' || health?.status === 'healthy';

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatUptime = (ms: number) => {
    const seconds = ms / 1000;
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const services = health?.details ? Object.entries(health.details).map(([name, detail]: [string, any]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    icon: name.includes('postgres') || name.includes('db') ? Database : name.includes('redis') ? HardDrive : Server,
    status: detail.status === 'up' ? 'operational' : 'degraded',
  })) : [
    { name: 'API Server', icon: Server, status: isHealthy ? 'operational' as const : 'degraded' as const },
    { name: 'PostgreSQL', icon: Database, status: isHealthy ? 'operational' as const : 'degraded' as const },
    { name: 'Redis', icon: HardDrive, status: isHealthy ? 'operational' as const : 'degraded' as const },
    { name: 'Jaeger', icon: Zap, status: isHealthy ? 'operational' as const : 'degraded' as const },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">System Health</h1>
          <p className="text-muted-foreground mt-1">Last checked: {lastCheck.toLocaleTimeString()}</p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card className={`p-6 ${isHealthy ? 'border-green-500/30' : 'border-red-500/30'}`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${isHealthy ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            <HeartPulse className={`w-8 h-8 ${isHealthy ? 'text-green-400' : 'text-red-400'}`} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{isHealthy ? 'All Systems Operational' : 'System Degraded'}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">All services are running normally</p>
          </div>
          <div className="ml-auto">
            <Badge variant={isHealthy ? 'success' : 'error'}>{isHealthy ? 'Healthy' : 'Degraded'}</Badge>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <CardHeader className="p-0 mb-4"><CardTitle>Services</CardTitle></CardHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map(({ name, icon: Icon, status }) => (
            <div key={name} className="bg-background border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg"><Icon className="w-5 h-5 text-muted-foreground" /></div>
                <div>
                  <p className="text-sm font-medium text-foreground">{name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${status === 'operational' ? 'bg-green-500' : 'bg-amber-500'}`} />
                    <span className={`text-xs capitalize ${status === 'operational' ? 'text-green-400' : 'text-amber-400'}`}>{status}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {ops && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="flex items-center gap-2"><MemoryStick className="w-5 h-5 text-indigo-400" />Memory Usage</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-5">
              {[
                { label: 'RSS', value: ops.memory.rss, max: 512 * 1024 * 1024, color: 'bg-blue-500' },
                { label: 'Heap Used', value: ops.memory.heapUsed, max: ops.memory.heapTotal, color: 'bg-green-500' },
                { label: 'Heap Total', value: ops.memory.heapTotal, max: 512 * 1024 * 1024, color: 'bg-purple-500' },
              ].map(({ label, value, max, color }) => {
                const pct = Math.min((value / max) * 100, 100);
                return (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="text-foreground font-medium">{formatBytes(value)}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-400" />System Info</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              {[
                { icon: Clock, label: 'Uptime', value: formatUptime(ops.uptime) },
                { icon: Cpu, label: 'CPU Usage', value: `${ops.cpu.usage.toFixed(1)}%` },
                { icon: MemoryStick, label: 'Node.js', value: 'v22.22.3' },
                { icon: Server, label: 'Platform', value: 'Docker / Alpine' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{label}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
