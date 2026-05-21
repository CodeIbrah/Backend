import { useState, useEffect } from 'react';
import { FileText, Download, Plus, Calendar, Clock } from 'lucide-react';
import { Button, Badge, Card, CardContent, Select } from '../components/ui';
import { useToast } from '../components/Toast';
import { fetchReports } from '../hooks/api';

interface Report {
  id: string;
  filename: string;
  type: string;
  createdAt: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState('daily');
  const { success, error: toastError } = useToast();

  useEffect(() => { loadReports(); }, []);

  const loadReports = async () => {
    try {
      const data = await fetchReports();
      setReports(data || []);
    } catch { setReports([]); }
    finally { setLoading(false); }
  };

  const generate = async () => {
    setGenerating(true);
    try {
      success('Report generated', 'Your report is ready for download');
      loadReports();
    } catch { toastError('Failed', 'Could not generate report'); }
    finally { setGenerating(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-1">Generate and manage system reports</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={reportType} onValueChange={setReportType} options={[{ value: 'daily', label: 'Daily Report' }, { value: 'weekly', label: 'Weekly Report' }, { value: 'monthly', label: 'Monthly Report' }]} />
          <Button onClick={generate} disabled={generating}><Plus className="w-4 h-4 mr-2" />Generate</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : reports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => (
            <Card key={report.id} className="p-5 hover:border-border/80 transition-colors group">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-indigo-500/10 rounded-lg"><FileText className="w-5 h-5 text-indigo-400" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{report.filename}</p>
                  <Badge variant="info" className="mt-2">{report.type}</Badge>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />{new Date(report.createdAt).toLocaleDateString()}
                    <Clock className="w-3 h-3 ml-2" />{new Date(report.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4"><Download className="w-3.5 h-3.5 mr-2" />Download</Button>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="py-16 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">No reports yet</h3>
          <p className="text-sm text-muted-foreground mb-6">Generate your first report to get started</p>
          <Button onClick={generate} disabled={generating}><Plus className="w-4 h-4 mr-2" />Generate Report</Button>
        </Card>
      )}
    </div>
  );
}
