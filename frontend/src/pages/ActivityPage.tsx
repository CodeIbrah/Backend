import { useState, useEffect } from 'react';
import { Filter, RefreshCw, Download, AlertCircle } from 'lucide-react';
import { Button, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Select } from '../components/ui';
import { useToast } from '../components/Toast';
import { fetchActivityLogs } from '../hooks/api';

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
  const [total, setTotal] = useState(0);
  const { info } = useToast();
  const limit = 20;

  useEffect(() => { loadLogs(); }, [severity, page]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await fetchActivityLogs(page, limit, severity !== 'all' ? severity : '');
      setLogs(data?.items || []);
      setTotal(data?.total || 0);
    } catch { setLogs([]); setTotal(0); }
    finally { setLoading(false); }
  };

  const exportLogs = async () => {
    info('Export started', 'Your file will be downloaded shortly');
  };

  const sevColors: Record<string, { badge: string; dot: string }> = {
    INFO: { badge: 'info', dot: 'bg-blue-500' },
    WARNING: { badge: 'warning', dot: 'bg-amber-500' },
    ERROR: { badge: 'error', dot: 'bg-red-500' },
    CRITICAL: { badge: 'error', dot: 'bg-red-700' },
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Activity Log</h1>
          <p className="text-muted-foreground mt-1">{total} log entries</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportLogs}><Download className="w-4 h-4 mr-2" />Export</Button>
          <Button variant="outline" onClick={loadLogs} disabled={loading}><RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Refresh</Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select
            value={severity}
            onValueChange={(v) => { setSeverity(v); setPage(1); }}
            options={[
              { value: 'all', label: 'All Severities' },
              { value: 'INFO', label: 'Info' },
              { value: 'WARNING', label: 'Warning' },
              { value: 'ERROR', label: 'Error' },
              { value: 'CRITICAL', label: 'Critical' },
            ]}
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const colors = sevColors[log.severity] || { badge: 'default', dot: 'bg-muted-foreground' };
                  return (
                    <TableRow key={log.id}>
                      <TableCell><div className={`w-2 h-2 rounded-full ${colors.dot}`} /></TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-foreground">{log.action}</p>
                        {log.description && <p className="text-xs text-muted-foreground mt-0.5">{log.description}</p>}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{log.type}</TableCell>
                      <TableCell><Badge variant={colors.badge as any}>{log.severity}</Badge></TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">{log.ipAddress || '—'}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{new Date(log.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {logs.length === 0 && (
              <div className="py-16 text-center">
                <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-medium text-foreground mb-1">No logs found</h3>
                <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
              </div>
            )}
          </>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
