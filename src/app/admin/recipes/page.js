'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '@/config/api';
import { logError } from '@/lib/logger';
import { Search, Trash2 } from 'lucide-react';
import Link from 'next/link';

const STATUSES = ['draft', 'published', 'archived'];

function StatusBadge({ status }) {
  const colors = {
    published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    draft: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    archived: 'bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${colors[status] || colors.archived}`}>
      {status}
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
          <button onClick={onConfirm} className="px-4 py-2 rounded bg-destructive text-destructive-foreground text-sm hover:bg-destructive/90">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminRecipesPage() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [actionError, setActionError] = useState(null);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`${API_ENDPOINTS.admin.recipes}?${params}`);
      if (!res.ok) throw new Error('Failed to load recipes');
      setRecipes(await res.json());
    } catch (e) {
      logError('AdminRecipesPage.fetchRecipes', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { fetchRecipes(); }, [fetchRecipes]);

  async function handleStatusChange(recipe, newStatus) {
    setActionError(null);
    try {
      const res = await fetch(API_ENDPOINTS.admin.recipeStatus(recipe.id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || 'Failed to update status');
      }
      fetchRecipes();
    } catch (e) {
      logError('AdminRecipesPage.handleStatusChange', e, { recipeId: recipe.id });
      setActionError(e.message);
    }
  }

  function confirmDelete(recipe) {
    setConfirm({
      message: `Delete recipe "${recipe.title}"? This cannot be undone.`,
      action: async () => {
        setActionError(null);
        try {
          const res = await fetch(API_ENDPOINTS.admin.deleteRecipe(recipe.id), { method: 'DELETE' });
          if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            throw new Error(d.detail || 'Failed to delete recipe');
          }
          fetchRecipes();
        } catch (e) {
          logError('AdminRecipesPage.confirmDelete', e, { recipeId: recipe.id });
          setActionError(e.message);
        }
        setConfirm(null);
      },
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-foreground">Recipe Moderation</h1>

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
            placeholder="Search by title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border rounded-md text-sm bg-background text-foreground w-64 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading recipes...</p>
      ) : error ? (
        <p className="text-destructive">{error}</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Title</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Author</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cuisine</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Views</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recipes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">No recipes found</td>
                </tr>
              ) : recipes.map((recipe) => (
                <tr key={recipe.id} className="border-t hover:bg-muted/20">
                  <td className="px-4 py-3 max-w-[240px]">
                    <Link href={`/recipes/${recipe.slug}`} className="font-medium text-primary hover:underline line-clamp-1">
                      {recipe.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{recipe.author_username}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={recipe.status} />
                      <select
                        value={recipe.status}
                        onChange={(e) => handleStatusChange(recipe, e.target.value)}
                        className="border rounded px-1.5 py-0.5 text-xs bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground capitalize text-xs">{recipe.cuisine_type || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{recipe.view_count}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(recipe.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button
                        title="Delete recipe"
                        onClick={() => confirmDelete(recipe)}
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
