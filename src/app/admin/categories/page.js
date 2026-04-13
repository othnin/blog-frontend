'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '@/config/api';
import { getCategoryImage } from '@/config/categoryImages';
import { Plus, Pencil, Trash2, Upload, Check, X, FolderOpen } from 'lucide-react';

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

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Create form
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit state: { id, name }
  const [editing, setEditing] = useState(null);

  // Confirm dialog
  const [confirm, setConfirm] = useState(null);

  // Image upload
  const [uploadingFor, setUploadingFor] = useState(null); // category id

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_ENDPOINTS.admin.categories);
      if (!res.ok) throw new Error('Failed to load categories');
      setCategories(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setActionError(null);
    setCreating(true);
    try {
      const res = await fetch(API_ENDPOINTS.admin.categories, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setActionError(d.detail || 'Failed to create category');
        return;
      }
      setNewName('');
      fetchCategories();
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdate(cat) {
    if (!editing?.name?.trim()) return;
    setActionError(null);
    const res = await fetch(API_ENDPOINTS.admin.category(cat.id), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editing.name.trim() }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setActionError(d.detail || 'Failed to update category');
      return;
    }
    setEditing(null);
    fetchCategories();
  }

  function confirmDelete(cat) {
    setConfirm({
      message: `Delete category "${cat.name}"? Posts in this category will become uncategorized.`,
      action: async () => {
        setActionError(null);
        const res = await fetch(API_ENDPOINTS.admin.category(cat.id), { method: 'DELETE' });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          setActionError(d.detail || 'Failed to delete category');
        } else {
          fetchCategories();
        }
        setConfirm(null);
      },
    });
  }

  async function handleImageUpload(cat, file) {
    setActionError(null);
    setUploadingFor(cat.id);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(API_ENDPOINTS.admin.categoryImage(cat.id), {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setActionError(d.detail || 'Failed to upload image');
        return;
      }
      fetchCategories();
    } finally {
      setUploadingFor(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-foreground">Categories</h1>

      {actionError && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive text-destructive rounded text-sm">
          {actionError}
          <button onClick={() => setActionError(null)} className="ml-2 underline text-xs">dismiss</button>
        </div>
      )}

      {/* Create form */}
      <form onSubmit={handleCreate} className="flex gap-3 mb-8">
        <input
          type="text"
          placeholder="New category name…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 max-w-xs px-4 py-2 border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={creating || !newName.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          {creating ? 'Creating…' : 'Add Category'}
        </button>
      </form>

      {loading ? (
        <p className="text-muted-foreground">Loading categories...</p>
      ) : error ? (
        <p className="text-destructive">{error}</p>
      ) : categories.length === 0 ? (
        <p className="text-muted-foreground">No categories yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div key={cat.id} className="border rounded-lg overflow-hidden bg-card">
              {/* Image area */}
              <div className="relative h-32 bg-muted flex items-center justify-center">
                {getCategoryImage(cat.slug, cat.image_url) ? (
                  <img
                    src={getCategoryImage(cat.slug, cat.image_url)}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FolderOpen className="w-10 h-10 text-muted-foreground/40" />
                )}
                {/* Upload overlay */}
                <label
                  className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 transition-colors cursor-pointer group"
                  title="Upload image"
                >
                  <Upload className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    disabled={uploadingFor === cat.id}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImageUpload(cat, f);
                      e.target.value = '';
                    }}
                  />
                </label>
                {uploadingFor === cat.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <span className="text-white text-xs">Uploading…</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-3">
                {editing?.id === cat.id ? (
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={editing.name}
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdate(cat);
                        if (e.key === 'Escape') setEditing(null);
                      }}
                      autoFocus
                      className="flex-1 px-2 py-1 border rounded text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <button onClick={() => handleUpdate(cat)} className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditing(null)} className="p-1 text-muted-foreground hover:bg-muted rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{cat.name}</p>
                      <p className="text-xs text-muted-foreground">{cat.post_count} post{cat.post_count !== 1 ? 's' : ''} · /{cat.slug}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        title="Edit name"
                        onClick={() => setEditing({ id: cat.id, name: cat.name })}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Delete category"
                        onClick={() => confirmDelete(cat)}
                        className="p-1.5 rounded hover:bg-destructive/10 text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
