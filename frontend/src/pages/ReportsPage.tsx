import { useState, useEffect } from 'react';
import { FileText, Download, Plus, RefreshCw, Calendar, Clock } from 'lucide-react';
import api from '../services/api';
import { Button, Badge } from '../components/ui';
import { useToast } from '../components/Toast';

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
      const { data } = await api.get('/reports');
      setReports(data.data || []);
    } catch { setReports([]); }
    finally { setLoading(false); }
  };

  const generate = async () => {
    setGenerating(true);
    try {
      await api.post('/reports/generate', { type: reportType });
      success('Report generated', 'Your report is ready for download');
      loadReports();
    } catch { toastError('Failed', 'Could not generate report'); }
    finally { setGenerating(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-[#6a6a82] mt-1">Generate and manage system reports</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="bg-[#12121a] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="daily">Daily Report</option>
            <option value="weekly">Weekly Report</option>
            <option value="monthly">Monthly Report</option>
          </select>
          <Button onClick={generate} loading={generating}>
            <Plus className="w-4 h-4" />
            Generate
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : reports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => (
            <div key={report.id} className="bg-[#12121a] border border-[#2a2a3e] rounded-xl p-5 hover:border-[#3a3a52] transition-colors group">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-indigo-500/10 rounded-lg">
                  <FileText className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{report.filename}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="info">{report.type}</Badge>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-[#6a6a82]">
                    <Calendar className="w-3 h-3" />
                    {new Date(report.createdAt).toLocaleDateString()}
                    <Clock className="w-3 h-3 ml-2" />
                    {new Date(report.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              <Button variant="secondary" size="sm" className="w-full mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Download className="w-3.5 h-3.5" />
                Download
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#12121a] border border-[#2a2a3e] rounded-xl py-16 text-center">
          <FileText className="w-12 h-12 text-[#6a6a82] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-1">No reports yet</h3>
          <p className="text-sm text-[#6a6a82] mb-6">Generate your first report to get started</p>
          <Button onClick={generate} loading={generating}>
            <Plus className="w-4 h-4" />
            Generate Report
          </Button>
        </div>
      )}
    </div>
  );
}
