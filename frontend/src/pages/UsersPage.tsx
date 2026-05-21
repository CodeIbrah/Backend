import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, CheckCircle, XCircle, MoreVertical, Loader2 } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import { Badge, Button, Modal, Input, Select } from '../components/ui';
import type { User } from '../types';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState('USER');
  const [saving, setSaving] = useState(false);
  const { success, error: toastError } = useToast();
  const limit = 10;

  useEffect(() => { loadUsers(); }, [page]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/users?page=${page}&limit=${limit}`);
      const items = data.data?.items || data.data || [];
      setUsers(Array.isArray(items) ? items : []);
      setTotal(data.data?.total || items.length || 0);
    } catch { setUsers([]); setTotal(0); }
    finally { setLoading(false); }
  };

  const filtered = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.name?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = async (user: User) => {
    try {
      await api.patch(`/users/${user.id}/active`, { isActive: !user.isActive });
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isActive: !u.isActive } : u));
      success('User updated', `${user.email} is now ${!user.isActive ? 'active' : 'inactive'}`);
    } catch { toastError('Failed', 'Could not update user status'); }
  };

  const deleteUser = async (user: User) => {
    if (!confirm(`Delete ${user.email}?`)) return;
    try {
      await api.delete(`/users/${user.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      success('User deleted');
    } catch { toastError('Failed', 'Could not delete user'); }
  };

  const openCreate = () => { setEditingUser(null); setFormName(''); setFormEmail(''); setFormRole('USER'); setModalOpen(true); };
  const openEdit = (user: User) => { setEditingUser(user); setFormName(user.name || ''); setFormEmail(user.email); setFormRole(user.role); setModalOpen(true); };

  const handleSave = async () => {
    if (!formEmail) return;
    setSaving(true);
    try {
      if (editingUser) {
        await api.patch(`/users/${editingUser.id}`, { name: formName, email: formEmail, role: formRole });
        success('User updated');
      } else {
        // Registration via admin would need a different endpoint
        toastError('Not available', 'Use the register page to create users');
        setSaving(false);
        return;
      }
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
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-[#6a6a82] mt-1">{total} total users</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6a6a82]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full bg-[#12121a] border border-[#2a2a3e] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#6a6a82] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="bg-[#12121a] border border-[#2a2a3e] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2a2a3e]">
                  {['User', 'Role', 'Status', 'Created', 'Actions'].map((h) => (
                    <th key={h} className={`text-left px-4 py-3 text-xs font-medium text-[#6a6a82] uppercase tracking-wider ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-b border-[#2a2a3e]/50 hover:bg-[#1a1a2e]/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-indigo-400">{user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{user.name || '—'}</p>
                          <p className="text-xs text-[#6a6a82] truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.role === 'ADMIN' ? 'error' : user.role === 'MODERATOR' ? 'warning' : 'info'}>{user.role}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.isActive ? 'success' : 'error'}>{user.isActive ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#6a6a82]">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => toggleStatus(user)} className="p-1.5 rounded-lg hover:bg-[#1a1a2e] text-[#6a6a82] hover:text-white transition-colors" title={user.isActive ? 'Deactivate' : 'Activate'}>
                          {user.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        <button onClick={() => openEdit(user)} className="p-1.5 rounded-lg hover:bg-[#1a1a2e] text-[#6a6a82] hover:text-white transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteUser(user)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#6a6a82] hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="py-12 text-center text-[#6a6a82]">No users found</div>}
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#2a2a3e]">
            <p className="text-sm text-[#6a6a82]">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingUser ? 'Edit User' : 'Create User'}>
        <div className="space-y-4">
          <Input label="Name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="John Doe" />
          <Input label="Email" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="user@example.com" required />
          <Select
            label="Role"
            value={formRole}
            onValueChange={setFormRole}
            options={[
              { value: 'USER', label: 'User' },
              { value: 'MODERATOR', label: 'Moderator' },
              { value: 'ADMIN', label: 'Admin' },
            ]}
          />
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{editingUser ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
