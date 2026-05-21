import { useState } from 'react';
import { CreditCard, DollarSign, TrendingUp, TrendingDown, Plus, Download, Search, Filter, ArrowUpRight, Clock } from 'lucide-react';
import { Badge, Button, Card, CardContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui';

const payments = [
  { id: 'pay_1', amount: 299.99, currency: 'USD', status: 'completed', method: 'credit_card', customer: 'John Doe', email: 'john@example.com', createdAt: '2026-05-21T10:00:00Z' },
  { id: 'pay_2', amount: 149.50, currency: 'USD', status: 'pending', method: 'bank_transfer', customer: 'Jane Smith', email: 'jane@example.com', createdAt: '2026-05-21T09:30:00Z' },
  { id: 'pay_3', amount: 599.00, currency: 'USD', status: 'completed', method: 'credit_card', customer: 'Bob Wilson', email: 'bob@example.com', createdAt: '2026-05-20T15:00:00Z' },
  { id: 'pay_4', amount: 75.00, currency: 'USD', status: 'refunded', method: 'credit_card', customer: 'Alice Brown', email: 'alice@example.com', createdAt: '2026-05-20T12:00:00Z' },
  { id: 'pay_5', amount: 1250.00, currency: 'USD', status: 'failed', method: 'bank_transfer', customer: 'Charlie Davis', email: 'charlie@example.com', createdAt: '2026-05-19T08:00:00Z' },
  { id: 'pay_6', amount: 450.00, currency: 'USD', status: 'completed', method: 'credit_card', customer: 'Diana Prince', email: 'diana@example.com', createdAt: '2026-05-19T14:00:00Z' },
];

const invoices = [
  { id: 'inv_1', number: 'INV-2026-001', amount: 299.99, status: 'paid', customer: 'John Doe', dueDate: '2026-06-01', createdAt: '2026-05-01' },
  { id: 'inv_2', number: 'INV-2026-002', amount: 149.50, status: 'sent', customer: 'Jane Smith', dueDate: '2026-06-15', createdAt: '2026-05-15' },
  { id: 'inv_3', number: 'INV-2026-003', amount: 599.00, status: 'overdue', customer: 'Bob Wilson', dueDate: '2026-05-15', createdAt: '2026-04-15' },
  { id: 'inv_4', number: 'INV-2026-004', amount: 1250.00, status: 'draft', customer: 'Charlie Davis', dueDate: '2026-07-01', createdAt: '2026-05-20' },
];

const statusMap: Record<string, { badge: 'success' | 'warning' | 'error' | 'info'; label: string }> = {
  completed: { badge: 'success', label: 'Completed' },
  pending: { badge: 'warning', label: 'Pending' },
  failed: { badge: 'error', label: 'Failed' },
  refunded: { badge: 'info', label: 'Refunded' },
  paid: { badge: 'success', label: 'Paid' },
  sent: { badge: 'info', label: 'Sent' },
  overdue: { badge: 'error', label: 'Overdue' },
  draft: { badge: 'info', label: 'Draft' },
};

export default function PaymentsPage() {
  const [tab, setTab] = useState<'payments' | 'invoices'>('payments');
  const [search, setSearch] = useState('');

  const totalRevenue = payments.filter((p) => p.status === 'completed').reduce((s, p) => s + p.amount, 0);
  const pendingTotal = payments.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const refundTotal = payments.filter((p) => p.status === 'refunded').reduce((s, p) => s + p.amount, 0);

  const filteredPayments = payments.filter((p) =>
    p.customer.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredInvoices = invoices.filter((i) =>
    i.customer.toLowerCase().includes(search.toLowerCase()) || i.number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Payments & Invoices</h1>
        <p className="text-muted-foreground mt-1">Manage transactions and billing</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div><p className="text-sm text-muted-foreground">Total Revenue</p><p className="text-2xl font-bold text-foreground mt-1">${totalRevenue.toFixed(2)}</p></div>
            <div className="p-2.5 rounded-lg bg-green-500/10"><DollarSign className="w-5 h-5 text-green-400" /></div>
          </div>
          <div className="flex items-center gap-1 mt-3"><ArrowUpRight className="w-3.5 h-3.5 text-green-400" /><span className="text-xs font-medium text-green-400">+12.5%</span></div>
        </Card>
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div><p className="text-sm text-muted-foreground">Pending</p><p className="text-2xl font-bold text-foreground mt-1">${pendingTotal.toFixed(2)}</p></div>
            <div className="p-2.5 rounded-lg bg-amber-500/10"><Clock className="w-5 h-5 text-amber-400" /></div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div><p className="text-sm text-muted-foreground">Refunds</p><p className="text-2xl font-bold text-foreground mt-1">${refundTotal.toFixed(2)}</p></div>
            <div className="p-2.5 rounded-lg bg-red-500/10"><TrendingDown className="w-5 h-5 text-red-400" /></div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div><p className="text-sm text-muted-foreground">Transactions</p><p className="text-2xl font-bold text-foreground mt-1">{payments.length}</p></div>
            <div className="p-2.5 rounded-lg bg-blue-500/10"><CreditCard className="w-5 h-5 text-blue-400" /></div>
          </div>
          <div className="flex items-center gap-1 mt-3"><ArrowUpRight className="w-3.5 h-3.5 text-green-400" /><span className="text-xs font-medium text-green-400">+3</span></div>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-3 mt-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${tab}...`} className="w-full bg-background border border-input rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all" />
          </div>
          <Button variant="outline"><Filter className="w-4 h-4 mr-2" />Filter</Button>
          <Button><Plus className="w-4 h-4 mr-2" />New {tab === 'payments' ? 'Payment' : 'Invoice'}</Button>
        </div>

        <TabsContent value="payments" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((p) => {
                  const st = statusMap[p.status];
                  return (
                    <TableRow key={p.id}>
                      <TableCell><p className="text-sm font-medium text-foreground">{p.customer}</p><p className="text-xs text-muted-foreground">{p.email}</p></TableCell>
                      <TableCell className="font-semibold text-foreground">${p.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-muted-foreground capitalize">{p.method.replace('_', ' ')}</TableCell>
                      <TableCell><Badge variant={st.badge}>{st.label}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="icon"><Download className="w-3.5 h-3.5" /></Button></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInvoices.map((inv) => {
              const st = statusMap[inv.status];
              return (
                <Card key={inv.id} className="p-5 hover:border-border/80 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-mono font-medium text-foreground">{inv.number}</span>
                    <Badge variant={st.badge}>{st.label}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{inv.customer}</p>
                  <p className="text-2xl font-bold text-foreground mt-2">${inv.amount.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Due: {new Date(inv.dueDate).toLocaleDateString()}</p>
                  <Button variant="outline" size="sm" className="w-full mt-4"><Download className="w-3.5 h-3.5 mr-2" />Download PDF</Button>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
