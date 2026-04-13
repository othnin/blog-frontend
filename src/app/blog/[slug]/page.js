'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { API_ENDPOINTS } from '@/config/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import LexicalRenderer from '@/components/LexicalRenderer';
import LexicalEditor from '@/components/LexicalEditor';
import CategorySelector from '@/components/CategorySelector';
import TagSelector from '@/components/TagSelector';
import { useAuth } from '@/components/authProvider';
import { fetchWithAuth } from '@/lib/tokenUtils';
import CommentThread from '@/components/CommentThread';
import { getCategoryImage } from '@/config/categoryImages';
import UserProfilePopup from '@/components/UserProfilePopup';

const STATUS_OPTIONS = ['draft', 'published', 'scheduled', 'archived'];

export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug;
  const { isAuthenticated, username, loading: authLoading } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [userRole, setUserRole] = useState(null);

  // Edit state
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Delete state
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Like state
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Profile popup
  const [profilePopup, setProfilePopup] = useState(null);

  useEffect(() => {
    if (!slug || authLoading || post) return;

    const loadPost = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/blog/posts/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setPost(data);
          setLikeCount(data.like_count ?? 0);
          try {
            const liked = JSON.parse(localStorage.getItem('liked_posts')) || [];
            setHasLiked(liked.includes(data.slug));
          } catch { /* ignore */ }
          return;
        }

        // Private posts (draft/scheduled/archived) are invisible to the public API.
        // Let the owner see their own post by checking their private list.
        if (res.status === 404 && isAuthenticated) {
          const myRes = await fetchWithAuth(API_ENDPOINTS.blog.myPosts);
          if (myRes.ok) {
            const myPosts = await myRes.json();
            const owned = myPosts.find((p) => p.slug === slug);
            if (owned) {
              setPost(owned);
              setLikeCount(owned.like_count ?? 0);
              return;
            }
          }
        }

        throw new Error('Post not found');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [slug, isAuthenticated, authLoading, post]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchWithAuth(API_ENDPOINTS.auth.me)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setUserRole(data.profile?.role); })
      .catch(() => {});
  }, [isAuthenticated]);

  const isOwner = isAuthenticated && post?.author?.username === username;
  const isAdmin = userRole === 'admin';
  const canEdit = isOwner || isAdmin;

  const enterEditMode = () => {
    setEditForm({
      title: post.title,
      content_json: post.content_json,
      category_id: post.category?.id ?? null,
      tag_ids: post.tags?.map(t => t.id) ?? [],
      status: post.status,
    });
    setSaveError(null);
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditForm(null);
    setSaveError(null);
  };

  const handleLike = async () => {
    if (!isAuthenticated) { setShowAuthDialog(true); return; }
    if (hasLiked) return;
    try {
      const response = await fetch(API_ENDPOINTS.blog.likePost(slug), { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setLikeCount(data.like_count);
        setHasLiked(true);
        try {
          const liked = JSON.parse(localStorage.getItem('liked_posts')) || [];
          localStorage.setItem('liked_posts', JSON.stringify([...liked, slug]));
        } catch { /* ignore */ }
      }
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleSave = async () => {
    if (!editForm.title.trim()) {
      setSaveError('Title is required');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetchWithAuth(`/api/blog/posts/${slug}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!response.ok) {
        const data = await response.json();
        setSaveError(data.detail || 'Failed to save post');
        return;
      }
      const updated = await response.json();
      setPost(updated);
      setEditMode(false);
      setEditForm(null);

      if (updated.status !== 'published') {
        // Non-published posts are invisible to the public API — go to the edit page
        router.replace(`/dashboard/edit/${updated.id}`);
      } else if (updated.slug !== slug) {
        // Published but slug changed (title edited) — follow to the new URL
        router.replace(`/blog/${updated.slug}`);
      }
    } catch (err) {
      setSaveError('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const response = await fetchWithAuth(`/api/blog/posts/${slug}/`, { method: 'DELETE' });
      if (response.ok) {
        router.push('/blog/posts');
      } else {
        const data = await response.json();
        setDeleteError(data.detail || 'Failed to delete post');
        setShowConfirm(false);
      }
    } catch (err) {
      setDeleteError('An error occurred while deleting');
      setShowConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Loading post...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-red-500 mb-4">Error: {error}</div>
        <Link href="/blog/posts" className="text-primary hover:underline">← Back to posts</Link>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Post not found</p>
        <Link href="/blog/posts" className="text-primary hover:underline">← Back to posts</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Join the conversation</DialogTitle>
            <DialogDescription>
              Please create an account if you want to contribute.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-start gap-2">
            <Link
              href="/register"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-medium"
              onClick={() => setShowAuthDialog(false)}
            >
              Create account
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 text-sm font-medium"
              onClick={() => setShowAuthDialog(false)}
            >
              Log in
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <Link href="/blog/posts" className="text-primary hover:underline">← Back to posts</Link>
        {canEdit && !editMode && (
          <div className="flex gap-2">
            <button
              onClick={enterEditMode}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-md transition-colors"
            >
              Edit Post
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              Delete Post
            </button>
          </div>
        )}
      </div>

      {deleteError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500 text-red-500 rounded-md text-sm">
          {deleteError}
        </div>
      )}

      {/* ── EDIT MODE ── */}
      {editMode && editForm && (
        <div className="bg-card rounded-lg p-6 md:p-8 space-y-5">
          <h2 className="text-xl font-semibold text-foreground">Edit Post</h2>

          {saveError && (
            <div className="p-3 bg-red-500/10 border border-red-500 text-red-500 rounded-md text-sm">
              {saveError}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">Title *</label>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">Status</label>
            <select
              value={editForm.status}
              onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
              className="px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">Category</label>
            <CategorySelector
              selectedId={editForm.category_id}
              onChange={(id) => setEditForm((f) => ({ ...f, category_id: id }))}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">Tags</label>
            <TagSelector
              selectedIds={editForm.tag_ids}
              onChange={(ids) => setEditForm((f) => ({ ...f, tag_ids: ids }))}
            />
          </div>

          {/* Content editor — key forces remount with current content */}
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">Content *</label>
            <LexicalEditor
              key={post.updated_at}
              initialValue={editForm.content_json}
              onChange={(json) => setEditForm((f) => ({ ...f, content_json: json }))}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t">
            <button
              onClick={cancelEdit}
              disabled={saving}
              className="px-4 py-2 text-sm rounded-md border border-input hover:bg-accent transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* ── VIEW MODE ── */}
      {!editMode && (
        <article className="bg-card rounded-lg p-6 md:p-8">
          <div className="flex gap-6 items-start">
            <div className="flex-1 min-w-0">
              <h1 className="text-4xl font-bold mb-4 text-foreground">{post.title}</h1>

              <div className="flex flex-wrap items-center gap-4 mb-6 text-muted-foreground">
                <button
                  className="flex items-center gap-2 hover:text-foreground transition-colors"
                  onClick={(e) => setProfilePopup({ username: post.author.username, anchorRect: e.currentTarget.getBoundingClientRect() })}
                >
                  {post.author.avatar_url ? (
                    <img src={post.author.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    <span className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      {post.author.username?.[0]?.toUpperCase()}
                    </span>
                  )}
                  <span className="hover:underline">By {post.author.username}</span>
                </button>
                <span>•</span>
                <span>{new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
                <span>•</span>
                <button
                  onClick={handleLike}
                  disabled={hasLiked}
                  className={`flex items-center gap-1 transition-colors ${hasLiked ? 'text-red-500 cursor-default' : 'hover:text-red-500'}`}
                >
                  <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
                  {likeCount}
                </button>
              </div>

              {post.category && (
                <div className="mb-3">
                  <span className="text-sm bg-secondary text-secondary-foreground px-3 py-1 rounded">
                    {post.category.name}
                  </span>
                </div>
              )}

              {post.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {post.tags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/blog/tags/${tag.slug}`}
                      className="text-xs px-2 py-1 rounded-full border border-primary/40 text-primary hover:bg-primary/10 transition-colors"
                    >
                      #{tag.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {post.category && getCategoryImage(post.category.slug) && (
              <div className="flex-shrink-0 text-center hidden sm:block">
                <img
                  src={getCategoryImage(post.category.slug)}
                  alt={post.category.name}
                  className="w-28 h-28 rounded-lg object-cover border border-border shadow-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">{post.category.name}</p>
              </div>
            )}
          </div>

          <div className="prose prose-invert max-w-none mb-6">
            <LexicalRenderer jsonContent={post.content_json} />
          </div>

          <div className="border-t pt-6 mt-6 flex flex-wrap gap-6 text-sm text-muted-foreground">
            <p>Status: <span className="capitalize">{post.status}</span></p>
            <p>Updated: {new Date(post.updated_at).toLocaleString()}</p>
          </div>
        </article>
      )}

      {/* ── COMMENTS ── only for published posts */}
      {!editMode && post && post.status === 'published' && (
        <section className="mt-8">
          <CommentThread postId={post.id} commentsDisabled={post.comments_disabled} />
        </section>
      )}

      {/* Delete confirmation dialog */}
      {profilePopup && (
        <UserProfilePopup
          username={profilePopup.username}
          anchorRect={profilePopup.anchorRect}
          onClose={() => setProfilePopup(null)}
        />
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => !deleting && setShowConfirm(false)}
          />
          <div className="relative bg-card border border-border rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h2 className="text-lg font-semibold text-foreground mb-2">Delete Post</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Are you sure you want to delete{' '}
              <span className="font-medium text-foreground">"{post.title}"</span>? This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm rounded-md border border-input hover:bg-accent transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm rounded-md bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, delete it'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
