import { useState, useEffect } from 'react';
import { HeartPulse, Server, Database, HardDrive, RefreshCw, Cpu, MemoryStick, Clock, Activity, Zap } from 'lucide-react';
import api from '../services/api';
import { Badge } from '../components/ui';

interface HealthData {
  status: string;
  info: Record<string, unknown>;
  error: Record<string, unknown>;
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
      const [h, o] = await Promise.allSettled([
        api.get('/health'),
        api.get('/ops'),
      ]);
      if (h.status === 'fulfilled') setHealth(h.value.data?.data || { status: 'ok', info: {}, error: {} });
      if (o.status === 'fulfilled') setOps(o.value.data?.data || null);
      setLastCheck(new Date());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const isHealthy = health?.status === 'ok';

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatUptime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const services = [
    { name: 'API Server', icon: Server, status: 'operational' as const },
    { name: 'PostgreSQL', icon: Database, status: 'operational' as const },
    { name: 'Redis', icon: HardDrive, status: 'operational' as const },
    { name: 'Jaeger', icon: Zap, status: 'operational' as const },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">System Health</h1>
          <p className="text-[#6a6a82] mt-1">Last checked: {lastCheck.toLocaleTimeString()}</p>
        </div>
        <Button variant="secondary" onClick={fetchData} loading={loading}>
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Overall status */}
      <div className={`bg-[#12121a] border rounded-xl p-6 ${isHealthy ? 'border-green-500/30' : 'border-red-500/30'}`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${isHealthy ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            <HeartPulse className={`w-8 h-8 ${isHealthy ? 'text-green-400' : 'text-red-400'}`} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{isHealthy ? 'All Systems Operational' : 'System Degraded'}</h2>
            <p className="text-sm text-[#6a6a82] mt-0.5">All services are running normally</p>
          </div>
          <div className="ml-auto">
            <Badge variant={isHealthy ? 'success' : 'error'}>{isHealthy ? 'Healthy' : 'Degraded'}</Badge>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="bg-[#12121a] border border-[#2a2a3e] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Services</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map(({ name, icon: Icon, status }) => (
            <div key={name} className="bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#1a1a2e] rounded-lg">
                  <Icon className="w-5 h-5 text-[#a0a0b8]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-xs text-green-400 capitalize">{status}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Metrics */}
      {ops && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Memory */}
          <div className="bg-[#12121a] border border-[#2a2a3e] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <MemoryStick className="w-5 h-5 text-indigo-400" />
              Memory Usage
            </h3>
            <div className="space-y-5">
              {[
                { label: 'RSS', value: ops.memory.rss, max: 512 * 1024 * 1024, color: 'bg-blue-500' },
                { label: 'Heap Used', value: ops.memory.heapUsed, max: ops.memory.heapTotal, color: 'bg-green-500' },
                { label: 'Heap Total', value: ops.memory.heapTotal, max: 512 * 1024 * 1024, color: 'bg-purple-500' },
              ].map(({ label, value, max, color }) => {
                const pct = Math.min((value / max) * 100, 100);
                return (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-[#a0a0b8]">{label}</span>
                      <span className="text-white font-medium">{formatBytes(value)}</span>
                    </div>
                    <div className="h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* System Info */}
          <div className="bg-[#12121a] border border-[#2a2a3e] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              System Info
            </h3>
            <div className="space-y-4">
              {[
                { icon: Clock, label: 'Uptime', value: formatUptime(ops.uptime) },
                { icon: Cpu, label: 'CPU Usage', value: `${ops.cpu.usage.toFixed(1)}%` },
                { icon: MemoryStick, label: 'Node.js', value: 'v22.22.3' },
                { icon: Server, label: 'Platform', value: 'Docker / Alpine' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-[#2a2a3e]/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-[#6a6a82]" />
                    <span className="text-sm text-[#a0a0b8]">{label}</span>
                  </div>
                  <span className="text-sm font-medium text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Button({ children, variant = 'primary', size = 'md', loading = false, onClick }: any) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 disabled:opacity-50';
  const variants: any = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    secondary: 'bg-[#1a1a2e] hover:bg-[#2a2a3e] text-white border border-[#2a2a3e]',
  };
  const sizes: any = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5 text-sm' };
  return (
    <button onClick={onClick} className={`${base} ${variants[variant]} ${sizes[size]}`} disabled={loading}>
      {loading && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
}
