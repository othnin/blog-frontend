'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '@/config/api';
import { logError } from '@/lib/logger';
import { Search, ShieldCheck, UserX, UserCheck, Trash2, ChevronDown } from 'lucide-react';

const ROLES = ['reader', 'editor', 'admin'];

function RoleBadge({ role }) {
  const colors = {
    admin: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    editor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    reader: 'bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${colors[role] || colors.reader}`}>
      {role}
    </span>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card border rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        <p className="text-foreground mb-4">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded border text-sm hover:bg-muted">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded bg-destructive text-destructive-foreground text-sm hover:bg-destructive/90">Confirm</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [confirm, setConfirm] = useState(null); // { message, action }
  const [actionError, setActionError] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const res = await fetch(`${API_ENDPOINTS.admin.users}?${params}`);
      if (!res.ok) throw new Error('Failed to load users');
      setUsers(await res.json());
    } catch (e) {
      logError('AdminUsersPage.fetchUsers', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function doAction(url, method, body) {
    setActionError(null);
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setActionError(d.detail || 'Action failed');
      return false;
    }
    return true;
  }

  async function handleRoleChange(user, newRole) {
    const ok = await doAction(API_ENDPOINTS.admin.userRole(user.id), 'PATCH', { role: newRole });
    if (ok) fetchUsers();
  }

  async function handleSuspend(user, suspend) {
    const ok = await doAction(API_ENDPOINTS.admin.userSuspend(user.id), 'PATCH', {
      is_suspended: suspend,
      suspend_reason: suspend ? 'Suspended by admin' : '',
    });
    if (ok) fetchUsers();
  }

  function confirmDelete(user) {
    setConfirm({
      message: `Permanently delete user "${user.username}"? This cannot be undone.`,
      action: async () => {
        const ok = await doAction(API_ENDPOINTS.admin.user(user.id), 'DELETE');
        if (ok) fetchUsers();
        setConfirm(null);
      },
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-foreground">User Management</h1>

      {actionError && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive text-destructive rounded text-sm">
          {actionError}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search username or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border rounded-md text-sm bg-background text-foreground w-64 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading users...</p>
      ) : error ? (
        <p className="text-destructive">{error}</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">No users found</td>
                </tr>
              ) : users.map((user) => (
                <tr key={user.id} className="border-t hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{user.username}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <RoleBadge role={user.profile?.role || 'reader'} />
                      <div className="relative group">
                        <button className="p-1 rounded hover:bg-muted text-muted-foreground">
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        <div className="absolute left-0 top-full mt-1 bg-popover border rounded-md shadow-lg z-10 hidden group-hover:block min-w-[100px]">
                          {ROLES.map((r) => (
                            <button
                              key={r}
                              onClick={() => handleRoleChange(user, r)}
                              className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-muted capitalize ${r === user.profile?.role ? 'font-semibold' : ''}`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {user.profile?.is_suspended ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">Suspended</span>
                    ) : user.is_active ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(user.date_joined).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      {user.profile?.is_suspended ? (
                        <button
                          title="Unsuspend"
                          onClick={() => handleSuspend(user, false)}
                          className="p-1.5 rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-green-700"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          title="Suspend"
                          onClick={() => handleSuspend(user, true)}
                          className="p-1.5 rounded hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-700"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        title="Delete user"
                        onClick={() => confirmDelete(user)}
                        className="p-1.5 rounded hover:bg-destructive/10 text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          onConfirm={confirm.action}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
