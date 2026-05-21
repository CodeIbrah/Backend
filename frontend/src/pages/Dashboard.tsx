import { useState, useEffect, useCallback } from 'react';
import {
  Users, Activity, TrendingUp, AlertTriangle, Clock, ArrowUpRight, ArrowDownRight,
  Shield, Database, HardDrive, Server, Zap,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, Badge, Skeleton } from '../components/ui';
import { fetchHealth, fetchMetrics, fetchOpsStatus, fetchActivityLogs, fetchUsers } from '../hooks/api';
import { useWebSocket } from '../hooks/websocket';

const chartData = [
  { time: '00:00', requests: 120, errors: 2, latency: 45 },
  { time: '04:00', requests: 80, errors: 1, latency: 38 },
  { time: '08:00', requests: 350, errors: 8, latency: 72 },
  { time: '10:00', requests: 520, errors: 12, latency: 95 },
  { time: '12:00', requests: 480, errors: 10, latency: 88 },
  { time: '14:00', requests: 420, errors: 7, latency: 65 },
  { time: '16:00', requests: 380, errors: 6, latency: 58 },
  { time: '18:00', requests: 250, errors: 4, latency: 52 },
  { time: '20:00', requests: 180, errors: 3, latency: 42 },
  { time: '22:00', requests: 140, errors: 2, latency: 38 },
];

const endpointData = [
  { endpoint: 'GET /health', latency: 12, requests: 1200 },
  { endpoint: 'POST /auth/login', latency: 102, requests: 450 },
  { endpoint: 'GET /users', latency: 45, requests: 380 },
  { endpoint: 'GET /activity-log', latency: 68, requests: 220 },
  { endpoint: 'POST /auth/register', latency: 1801, requests: 85 },
  { endpoint: 'GET /analytics', latency: 95, requests: 150 },
  { endpoint: 'GET /reports', latency: 35, requests: 95 },
];

export default function Dashboard() {
  const [stats, setStats] = useState({ users: 0, activeUsers: 0, requests: 0, errorRate: 0, avgLatency: 0, uptime: '0h' });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [systemStatus, setSystemStatus] = useState<{ name: string; icon: any; status: string; color: string }[]>([
    { name: 'API Server', icon: Server, status: 'checking', color: 'text-amber-400' },
    { name: 'PostgreSQL', icon: Database, status: 'checking', color: 'text-amber-400' },
    { name: 'Redis', icon: HardDrive, status: 'checking', color: 'text-amber-400' },
    { name: 'Jaeger', icon: Zap, status: 'checking', color: 'text-amber-400' },
  ]);
  const [loading, setLoading] = useState(true);
  const [wsStats, setWsStats] = useState({ connected: 0 });

  const { isConnected } = useWebSocket('/events', {
    autoConnect: true,
    onMessage: useCallback(({ event, data }: { event: string; data: any }) => {
      if (event === 'stats') setWsStats(data);
      if (event === 'health_update') {
        setSystemStatus(prev => prev.map(s => {
          const key = s.name.toLowerCase().replace(' ', '');
          if (data[key]) {
            const isUp = data[key].status === 'up';
            return { ...s, status: isUp ? 'operational' : 'degraded', color: isUp ? 'text-green-400' : 'text-red-400' };
          }
          return s;
        }));
      }
      if (event === 'new_activity') {
        setRecentLogs(prev => [data, ...prev].slice(0, 5));
      }
    }, []),
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [healthRes, opsRes, usersRes, logsRes] = await Promise.allSettled([
          fetchHealth(),
          fetchOpsStatus(),
          fetchUsers(1, 1),
          fetchActivityLogs(1, 5),
        ]);

        const userCount = usersRes.status === 'fulfilled' ? usersRes.value?.total || 0 : 0;
        const opsData = opsRes.status === 'fulfilled' ? opsRes.value : null;
        const uptimeMs = opsData?.uptime || 0;
        const uptimeH = Math.floor(uptimeMs / 3600000);

        setStats({
          users: userCount,
          activeUsers: userCount,
          requests: 2850,
          errorRate: 0.4,
          avgLatency: 52,
          uptime: `${uptimeH}h`,
        });

        if (healthRes.status === 'fulfilled') {
          const health = healthRes.value;
          setSystemStatus(prev => prev.map(s => {
            const key = s.name.toLowerCase().replace(' ', '');
            const detail = health?.details?.[key] || health?.details?.[s.name];
            const isUp = detail?.status === 'up' || health?.status === 'ok';
            return { ...s, status: isUp ? 'operational' : 'degraded', color: isUp ? 'text-green-400' : 'text-red-400' };
          }));
        }

        if (logsRes.status === 'fulfilled' && logsRes.value) {
          const logs = logsRes.value.items || logsRes.value;
          setRecentLogs(Array.isArray(logs) ? logs.slice(0, 5) : []);
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-5"><div className="space-y-3"><Skeleton className="h-4 w-20" /><Skeleton className="h-8 w-16" /><Skeleton className="h-3 w-24" /></div></Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats.users.toString(), icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', change: '+12%', up: true },
    { label: 'Active Users', value: stats.activeUsers.toString(), icon: Activity, color: 'text-green-400', bg: 'bg-green-500/10', change: '+8%', up: true },
    { label: 'Total Requests', value: stats.requests.toLocaleString(), icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10', change: '+23%', up: true },
    { label: 'Error Rate', value: `${stats.errorRate}%`, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', change: '-0.2%', up: false },
    { label: 'Avg Latency', value: `${stats.avgLatency}ms`, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', change: '-15ms', up: false },
    { label: 'Uptime', value: stats.uptime, icon: Shield, color: 'text-emerald-400', bg: 'bg-emerald-500/10', change: '99.9%', up: true },
  ];

  const severityColors: Record<string, string> = {
    INFO: 'bg-blue-500',
    WARNING: 'bg-amber-500',
    ERROR: 'bg-red-500',
    CRITICAL: 'bg-red-700',
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted text-xs">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={isConnected ? 'text-green-400' : 'text-red-400'}>{isConnected ? 'Live' : 'Offline'}</span>
            {wsStats.connected > 0 && <span className="text-muted-foreground">· {wsStats.connected} connected</span>}
          </div>
        </div>
        <p className="text-muted-foreground mt-1">Overview of your system performance and activity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg, change, up }) => (
          <Card key={label} className="p-5 hover:border-border/80 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
              </div>
              <div className={`p-2.5 rounded-lg ${bg}`}><Icon className={`w-5 h-5 ${color}`} /></div>
            </div>
            <div className="flex items-center gap-1 mt-3">
              {up ? <ArrowUpRight className="w-3.5 h-3.5 text-green-400" /> : <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />}
              <span className={`text-xs font-medium ${up ? 'text-green-400' : 'text-red-400'}`}>{change}</span>
              <span className="text-xs text-muted-foreground ml-1">vs last week</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <CardHeader className="p-0 mb-6"><CardTitle>Requests & Errors</CardTitle><p className="text-sm text-muted-foreground">Last 24 hours</p></CardHeader>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gradRequests" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} /><stop offset="100%" stopColor="#6366f1" stopOpacity={0} /></linearGradient>
                <linearGradient id="gradErrors" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="100%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
              <XAxis dataKey="time" stroke="#6a6a82" tick={{ fontSize: 12 }} />
              <YAxis stroke="#6a6a82" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#12121a', border: '1px solid #2a2a3e', borderRadius: '8px' }} labelStyle={{ color: '#a0a0b8' }} />
              <Area type="monotone" dataKey="requests" stroke="#6366f1" strokeWidth={2} fill="url(#gradRequests)" />
              <Area type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} fill="url(#gradErrors)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <CardHeader className="p-0 mb-6"><CardTitle>Endpoint Latency</CardTitle><p className="text-sm text-muted-foreground">Average response time</p></CardHeader>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={endpointData} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" horizontal={false} />
              <XAxis type="number" stroke="#6a6a82" tick={{ fontSize: 11 }} />
              <YAxis dataKey="endpoint" type="category" stroke="#a0a0b8" tick={{ fontSize: 10 }} width={100} />
              <Tooltip contentStyle={{ backgroundColor: '#12121a', border: '1px solid #2a2a3e', borderRadius: '8px' }} formatter={(v: number) => [`${v}ms`, 'Latency']} />
              <Bar dataKey="latency" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <CardHeader className="p-0 mb-4"><CardTitle>System Status</CardTitle></CardHeader>
          <div className="space-y-4">
            {systemStatus.map(({ name, icon: Icon, status, color }) => (
              <div key={name} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg"><Icon className="w-4 h-4 text-muted-foreground" /></div>
                  <span className="text-sm text-foreground">{name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${color}`} />
                  <Badge variant={status === 'operational' ? 'success' : 'warning'}>{status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <CardHeader className="p-0 mb-4"><CardTitle>Recent Activity</CardTitle></CardHeader>
          <div className="space-y-3">
            {recentLogs.length > 0 ? recentLogs.map((log: any) => (
              <div key={log.id} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${severityColors[log.severity] || 'bg-muted-foreground'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{log.action}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{log.type} · {new Date(log.createdAt).toLocaleTimeString()}</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
