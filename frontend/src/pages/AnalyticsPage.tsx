import { useState, useEffect } from 'react';
import { TrendingUp, Users, Clock, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '../components/ui';
import { fetchAnalytics } from '../hooks/api';

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

const pieData = [
  { name: 'GET', value: 65, color: '#6366f1' },
  { name: 'POST', value: 20, color: '#22c55e' },
  { name: 'PATCH', value: 10, color: '#f59e0b' },
  { name: 'DELETE', value: 5, color: '#ef4444' },
];

const endpoints = [
  { endpoint: 'GET /health', latency: 12, requests: 1200, errorRate: 0 },
  { endpoint: 'POST /auth/login', latency: 102, requests: 450, errorRate: 2.1 },
  { endpoint: 'GET /users', latency: 45, requests: 380, errorRate: 0.5 },
  { endpoint: 'GET /activity-log', latency: 68, requests: 220, errorRate: 1.2 },
  { endpoint: 'POST /auth/register', latency: 1801, requests: 85, errorRate: 3.5 },
  { endpoint: 'GET /analytics', latency: 95, requests: 150, errorRate: 0.8 },
];

export default function AnalyticsPage() {
  const [overview, setOverview] = useState({ totalRequests: 2850, avgLatency: 52, errorRate: 0.4, activeUsers: 23 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics().then((data) => {
      if (data) setOverview({ totalRequests: data.totalRequests || 2850, avgLatency: data.avgResponseTime || 52, errorRate: data.errorRate || 0.4, activeUsers: data.activeUsers || 23 });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Performance metrics and usage insights</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Requests', value: overview.totalRequests.toLocaleString(), icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10', change: '+23%', up: true },
          { label: 'Avg Latency', value: `${overview.avgLatency}ms`, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', change: '-15ms', up: false },
          { label: 'Error Rate', value: `${overview.errorRate}%`, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', change: '-0.2%', up: false },
          { label: 'Active Users', value: overview.activeUsers.toString(), icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', change: '+8%', up: true },
        ].map(({ label, value, icon: Icon, color, bg, change, up }) => (
          <Card key={label} className="p-5">
            <div className="flex items-start justify-between">
              <div><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold text-foreground mt-1">{value}</p></div>
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
          <CardHeader className="p-0 mb-6"><CardTitle>Request Volume</CardTitle><p className="text-sm text-muted-foreground">Last 24 hours</p></CardHeader>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gradReq" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} /><stop offset="100%" stopColor="#6366f1" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
              <XAxis dataKey="time" stroke="#6a6a82" tick={{ fontSize: 12 }} />
              <YAxis stroke="#6a6a82" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#12121a', border: '1px solid #2a2a3e', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="requests" stroke="#6366f1" strokeWidth={2} fill="url(#gradReq)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <CardHeader className="p-0 mb-6"><CardTitle>HTTP Methods</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#12121a', border: '1px solid #2a2a3e', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {pieData.map(({ name, color }) => (
              <div key={name} className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} /><span className="text-xs text-muted-foreground">{name}</span></div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <CardHeader className="p-0 mb-4"><CardTitle>Endpoint Performance</CardTitle></CardHeader>
        <div className="space-y-3">
          {endpoints.map(({ endpoint, latency, requests, errorRate }) => (
            <div key={endpoint} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div className="flex items-center gap-4 flex-1">
                <code className="text-sm text-foreground font-mono">{endpoint}</code>
                <Badge variant={latency > 500 ? 'error' : latency > 100 ? 'warning' : 'success'}>{latency}ms</Badge>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <span className="text-muted-foreground">{requests.toLocaleString()} req</span>
                <span className={errorRate > 2 ? 'text-red-400' : 'text-muted-foreground'}>{errorRate}% err</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
