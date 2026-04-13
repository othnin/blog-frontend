'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '@/config/api';
import { logError } from '@/lib/logger';
import { Search, Trash2 } from 'lucide-react';
import Link from 'next/link';

const STATUSES = ['draft', 'published', 'scheduled', 'archived'];

function StatusBadge({ status }) {
  const colors = {
    published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    draft: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
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

export default function AdminPostsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [actionError, setActionError] = useState(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`${API_ENDPOINTS.admin.posts}?${params}`);
      if (!res.ok) throw new Error('Failed to load posts');
      setPosts(await res.json());
    } catch (e) {
      logError('AdminPostsPage.fetchPosts', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  async function handleStatusChange(post, newStatus) {
    setActionError(null);
    const res = await fetch(API_ENDPOINTS.admin.postStatus(post.id), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setActionError(d.detail || 'Failed to update status');
      return;
    }
    fetchPosts();
  }

  function confirmDelete(post) {
    setConfirm({
      message: `Delete post "${post.title}"? This cannot be undone.`,
      action: async () => {
        setActionError(null);
        const res = await fetch(API_ENDPOINTS.admin.deletePost(post.id), { method: 'DELETE' });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          setActionError(d.detail || 'Failed to delete post');
        } else {
          fetchPosts();
        }
        setConfirm(null);
      },
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-foreground">Post Moderation</h1>

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
        <p className="text-muted-foreground">Loading posts...</p>
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
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Stats</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">No posts found</td>
                </tr>
              ) : posts.map((post) => (
                <tr key={post.id} className="border-t hover:bg-muted/20">
                  <td className="px-4 py-3 max-w-[260px]">
                    <Link href={`/blog/${post.slug}`} className="font-medium text-primary hover:underline line-clamp-1">
                      {post.title}
                    </Link>
                    {post.category_name && (
                      <p className="text-xs text-muted-foreground mt-0.5">{post.category_name}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{post.author_username}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={post.status} />
                      <select
                        value={post.status}
                        onChange={(e) => handleStatusChange(post, e.target.value)}
                        className="border rounded px-1.5 py-0.5 text-xs bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    <span>{post.view_count} views</span>
                    <span className="mx-1">·</span>
                    <span>{post.like_count} likes</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(post.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button
                        title="Delete post"
                        onClick={() => confirmDelete(post)}
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
