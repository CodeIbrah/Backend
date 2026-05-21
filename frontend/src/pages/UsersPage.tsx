import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '../components/Toast';
import { Badge, Button, Modal, Input, Select, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui';
import type { User } from '../types';
import { fetchUsers, updateUser, deleteUser as apiDeleteUser } from '../hooks/api';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('USER');
  const [saving, setSaving] = useState(false);
  const { success, error: toastError } = useToast();
  const limit = 10;

  useEffect(() => { loadUsers(); }, [page]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchUsers(page, limit, search);
      setUsers(data?.items || []);
      setTotal(data?.total || 0);
    } catch { setUsers([]); setTotal(0); }
    finally { setLoading(false); }
  };

  const filtered = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.name?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = async (user: User) => {
    try {
      await updateUser(user.id, { isActive: !user.isActive });
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isActive: !u.isActive } : u));
      success('User updated', `${user.email} is now ${!user.isActive ? 'active' : 'inactive'}`);
    } catch { toastError('Failed', 'Could not update user status'); }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Delete ${user.email}?`)) return;
    try {
      await apiDeleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      success('User deleted');
    } catch { toastError('Failed', 'Could not delete user'); }
  };

  const openEdit = (user: User) => { setEditingUser(user); setFormName(user.name || ''); setFormRole(user.role); setModalOpen(true); };

  const handleSave = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      await updateUser(editingUser.id, { name: formName, role: formRole });
      success('User updated');
      setModalOpen(false);
      loadUsers();
    } catch { toastError('Failed', 'Could not save user'); }
    finally { setSaving(false); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground mt-1">{total} total users</p>
        </div>
        <Button><Plus className="w-4 h-4 mr-2" />Add User</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search users..."
          className="w-full bg-background border border-input rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
        />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-indigo-400">{user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{user.name || '—'}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'ADMIN' ? 'destructive' : user.role === 'MODERATOR' ? 'warning' : 'info'}>{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'success' : 'error'}>{user.isActive ? 'Active' : 'Inactive'}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => toggleStatus(user)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title={user.isActive ? 'Deactivate' : 'Activate'}>
                          {user.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        <button onClick={() => openEdit(user)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(user)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filtered.length === 0 && <div className="py-12 text-center text-muted-foreground">No users found</div>}
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingUser ? 'Edit User' : 'Create User'}>
        <div className="space-y-4">
          <Input label="Name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="John Doe" />
          <Select label="Role" value={formRole} onValueChange={setFormRole} options={[{ value: 'USER', label: 'User' }, { value: 'MODERATOR', label: 'Moderator' }, { value: 'ADMIN', label: 'Admin' }]} />
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Update</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
