import { useState, useEffect } from 'react';
import { Filter, RefreshCw, Download, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { Button, Badge } from '../components/ui';
import { useToast } from '../components/Toast';

interface Log {
  id: string;
  type: string;
  severity: string;
  action: string;
  resource: string | null;
  description: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState('all');
  const [page, setPage] = useState(1);
  const { info } = useToast();
  const limit = 20;

  useEffect(() => { loadLogs(); }, [severity, page]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (severity !== 'all') params.set('severity', severity);
      const { data } = await api.get(`/activity-log?${params}`);
      const items = data.data?.items || data.data || [];
      setLogs(Array.isArray(items) ? items : []);
    } catch { setLogs([]); }
    finally { setLoading(false); }
  };

  const exportLogs = async () => {
    try {
      await api.post('/activity-log/export', { format: 'json' });
      info('Export started', 'Your file will be downloaded shortly');
    } catch { /* ignore */ }
  };

  const sevColors: Record<string, { badge: string; dot: string }> = {
    INFO: { badge: 'info', dot: 'bg-blue-500' },
    WARNING: { badge: 'warning', dot: 'bg-amber-500' },
    ERROR: { badge: 'error', dot: 'bg-red-500' },
    CRITICAL: { badge: 'error', dot: 'bg-red-700' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Activity Log</h1>
          <p className="text-[#6a6a82] mt-1">System events and user actions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={exportLogs}>
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="secondary" onClick={loadLogs}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-[#6a6a82]" />
        <select
          value={severity}
          onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
          className="bg-[#12121a] border border-[#2a2a3e] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Severities</option>
          <option value="INFO">Info</option>
          <option value="WARNING">Warning</option>
          <option value="ERROR">Error</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </div>

      {/* Logs */}
      <div className="bg-[#12121a] border border-[#2a2a3e] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="divide-y divide-[#2a2a3e]/50">
            {logs.map((log) => {
              const colors = sevColors[log.severity] || { badge: 'default' as const, dot: 'bg-[#6a6a82]' };
              return (
                <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-[#1a1a2e]/30 transition-colors">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${colors.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-white">{log.action}</p>
                      <Badge variant={colors.badge as any}>{log.severity}</Badge>
                    </div>
                    {log.description && <p className="text-sm text-[#a0a0b8] mt-1">{log.description}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-[#6a6a82]">
                      <span>{log.type}</span>
                      {log.resource && <span>Resource: {log.resource}</span>}
                      {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {logs.length === 0 && !loading && (
          <div className="py-16 text-center">
            <AlertCircle className="w-10 h-10 text-[#6a6a82] mx-auto mb-3" />
            <p className="text-[#6a6a82]">No activity logs found</p>
          </div>
        )}
      </div>
    </div>
  );
}
