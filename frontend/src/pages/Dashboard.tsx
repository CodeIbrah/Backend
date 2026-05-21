import { useState, useEffect } from 'react';
import {
  Users, Activity, TrendingUp, AlertTriangle, Clock, ArrowUpRight, ArrowDownRight,
  Shield, Database, HardDrive, Server, Zap,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar,
} from 'recharts';
import api from '../services/api';

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
  const [stats, setStats] = useState({
    users: 0, activeUsers: 0, requests: 0, errorRate: 0, avgLatency: 0, uptime: '0h',
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [healthRes, logsRes, opsRes] = await Promise.allSettled([
          api.get('/health'),
          api.get('/activity-log?limit=5'),
          api.get('/ops'),
        ]);

        const usersRes = await api.get('/users').catch(() => null);
        const userCount = usersRes?.status === 200 ? (usersRes.data.data?.total || usersRes.data.data?.length || 0) : 0;

        setStats({
          users: userCount,
          activeUsers: userCount,
          requests: 2850,
          errorRate: 0.4,
          avgLatency: 52,
          uptime: '2h',
        });

        if (logsRes.status === 'fulfilled' && logsRes.value.data?.data) {
          const logs = logsRes.value.data.data.items || logsRes.value.data.data;
          setRecentLogs(Array.isArray(logs) ? logs.slice(0, 5) : []);
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

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
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-[#6a6a82] mt-1">Overview of your system performance and activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg, change, up }) => (
          <div key={label} className="bg-[#12121a] border border-[#2a2a3e] rounded-xl p-5 hover:border-[#3a3a52] transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[#6a6a82]">{label}</p>
                <p className="text-2xl font-bold text-white mt-1">{value}</p>
              </div>
              <div className={`p-2.5 rounded-lg ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3">
              {up ? <ArrowUpRight className="w-3.5 h-3.5 text-green-400" /> : <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />}
              <span className={`text-xs font-medium ${up ? 'text-green-400' : 'text-red-400'}`}>{change}</span>
              <span className="text-xs text-[#6a6a82] ml-1">vs last week</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Requests chart */}
        <div className="lg:col-span-2 bg-[#12121a] border border-[#2a2a3e] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-1">Requests & Errors</h3>
          <p className="text-sm text-[#6a6a82] mb-6">Last 24 hours</p>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gradRequests" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradErrors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
              <XAxis dataKey="time" stroke="#6a6a82" tick={{ fontSize: 12 }} />
              <YAxis stroke="#6a6a82" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#12121a', border: '1px solid #2a2a3e', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                labelStyle={{ color: '#a0a0b8' }}
              />
              <Area type="monotone" dataKey="requests" stroke="#6366f1" strokeWidth={2} fill="url(#gradRequests)" />
              <Area type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} fill="url(#gradErrors)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Latency chart */}
        <div className="bg-[#12121a] border border-[#2a2a3e] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-1">Endpoint Latency</h3>
          <p className="text-sm text-[#6a6a82] mb-6">Average response time</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={endpointData} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" horizontal={false} />
              <XAxis type="number" stroke="#6a6a82" tick={{ fontSize: 11 }} />
              <YAxis dataKey="endpoint" type="category" stroke="#a0a0b8" tick={{ fontSize: 10 }} width={100} />
              <Tooltip
                contentStyle={{ backgroundColor: '#12121a', border: '1px solid #2a2a3e', borderRadius: '8px' }}
                formatter={(v: number) => [`${v}ms`, 'Latency']}
              />
              <Bar dataKey="latency" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* System status + Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System status */}
        <div className="bg-[#12121a] border border-[#2a2a3e] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
          <div className="space-y-4">
            {[
              { name: 'API Server', icon: Server, status: 'operational', color: 'text-green-400' },
              { name: 'PostgreSQL', icon: Database, status: 'operational', color: 'text-green-400' },
              { name: 'Redis', icon: HardDrive, status: 'operational', color: 'text-green-400' },
              { name: 'Jaeger', icon: Zap, status: 'operational', color: 'text-green-400' },
            ].map(({ name, icon: Icon, status, color }) => (
              <div key={name} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#1a1a2e] rounded-lg">
                    <Icon className="w-4 h-4 text-[#a0a0b8]" />
                  </div>
                  <span className="text-sm text-white">{name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${color}`} />
                  <span className={`text-xs font-medium capitalize ${color}`}>{status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-[#12121a] border border-[#2a2a3e] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentLogs.length > 0 ? recentLogs.map((log: any) => (
              <div key={log.id} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${severityColors[log.severity] || 'bg-[#6a6a82]'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{log.action}</p>
                  <p className="text-xs text-[#6a6a82] mt-0.5">
                    {log.type} · {new Date(log.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-[#6a6a82] py-4 text-center">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
