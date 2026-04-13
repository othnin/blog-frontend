'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '@/config/api';
import { logError } from '@/lib/logger';
import { Plus, Pencil, Trash2, Check, X, Tag } from 'lucide-react';

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card border rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        <p className="text-foreground mb-4">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded border text-sm hover:bg-muted">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded bg-destructive text-destructive-foreground text-sm hover:bg-destructive/90">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminTagsPage() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Create form
  const [newName, setNewName] = useState('');
  const [newMeta, setNewMeta] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit state: { id, name, meta_description }
  const [editing, setEditing] = useState(null);

  // Confirm dialog
  const [confirm, setConfirm] = useState(null);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_ENDPOINTS.admin.tags);
      if (!res.ok) throw new Error('Failed to load tags');
      setTags(await res.json());
    } catch (e) {
      logError('AdminTagsPage.fetchTags', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTags(); }, [fetchTags]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setActionError(null);
    setCreating(true);
    try {
      const res = await fetch(API_ENDPOINTS.admin.tags, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), meta_description: newMeta.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setActionError(d.detail || 'Failed to create tag');
        return;
      }
      setNewName('');
      setNewMeta('');
      fetchTags();
    } catch (e) {
      logError('AdminTagsPage.handleCreate', e);
      setActionError(e.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdate(tag) {
    if (!editing?.name?.trim()) return;
    setActionError(null);
    try {
      const res = await fetch(API_ENDPOINTS.admin.tag(tag.id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editing.name.trim(),
          meta_description: editing.meta_description ?? '',
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setActionError(d.detail || 'Failed to update tag');
        return;
      }
      setEditing(null);
      fetchTags();
    } catch (e) {
      logError('AdminTagsPage.handleUpdate', e);
      setActionError(e.message);
    }
  }

  function confirmDelete(tag) {
    setConfirm({
      message: `Delete tag "${tag.name}"? It will be removed from all posts.`,
      action: async () => {
        setActionError(null);
        try {
          const res = await fetch(API_ENDPOINTS.admin.tag(tag.id), { method: 'DELETE' });
          if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            setActionError(d.detail || 'Failed to delete tag');
          } else {
            fetchTags();
          }
        } catch (e) {
          logError('AdminTagsPage.confirmDelete', e);
          setActionError(e.message);
        }
        setConfirm(null);
      },
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-foreground">Tags</h1>

      {actionError && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive text-destructive rounded text-sm">
          {actionError}
          <button onClick={() => setActionError(null)} className="ml-2 underline text-xs">dismiss</button>
        </div>
      )}

      {/* Create form */}
      <form onSubmit={handleCreate} className="flex gap-3 mb-8 flex-wrap items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Tag name</label>
          <input
            type="text"
            placeholder="e.g. JavaScript"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="px-4 py-2 border rounded-md text-sm bg-background text-foreground w-48 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Meta description (optional)</label>
          <input
            type="text"
            placeholder="Brief description…"
            value={newMeta}
            onChange={(e) => setNewMeta(e.target.value)}
            className="px-4 py-2 border rounded-md text-sm bg-background text-foreground w-72 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="submit"
          disabled={creating || !newName.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          {creating ? 'Creating…' : 'Add Tag'}
        </button>
      </form>

      {loading ? (
        <p className="text-muted-foreground">Loading tags...</p>
      ) : error ? (
        <p className="text-destructive">{error}</p>
      ) : tags.length === 0 ? (
        <p className="text-muted-foreground">No tags yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tags.map((tag) => (
            <div key={tag.id} className="border rounded-lg bg-card p-4">
              {/* Icon row */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">/{tag.slug}</span>
                <span className="ml-auto text-xs text-muted-foreground">{tag.post_count} post{tag.post_count !== 1 ? 's' : ''}</span>
              </div>

              {editing?.id === tag.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdate(tag);
                      if (e.key === 'Escape') setEditing(null);
                    }}
                    autoFocus
                    placeholder="Tag name"
                    className="w-full px-2 py-1 border rounded text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <input
                    type="text"
                    value={editing.meta_description}
                    onChange={(e) => setEditing({ ...editing, meta_description: e.target.value })}
                    placeholder="Meta description (optional)"
                    className="w-full px-2 py-1 border rounded text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => handleUpdate(tag)} className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditing(null)} className="p-1 text-muted-foreground hover:bg-muted rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{tag.name}</p>
                      {tag.meta_description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{tag.meta_description}</p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        title="Edit tag"
                        onClick={() => setEditing({ id: tag.id, name: tag.name, meta_description: tag.meta_description || '' })}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Delete tag"
                        onClick={() => confirmDelete(tag)}
                        className="p-1.5 rounded hover:bg-destructive/10 text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
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
