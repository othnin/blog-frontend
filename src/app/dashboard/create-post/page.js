'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/authProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_ENDPOINTS } from '@/config/api';
import { fetchWithAuth } from '@/lib/tokenUtils';
import LexicalEditor from '@/components/LexicalEditor';
import CategorySelector from '@/components/CategorySelector';
import TagSelector from '@/components/TagSelector';

export default function CreatePostPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    content_json: JSON.stringify({
      root: {
        children: [
          {
            children: [{ text: '', type: 'text' }],
            type: 'paragraph'
          }
        ],
        type: 'root'
      }
    }),
    category_id: null,
    tag_ids: [],
    status: 'draft',
    comments_disabled: false,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && !authLoading) {
      fetchWithAuth(API_ENDPOINTS.auth.me)
        .then(r => r.json())
        .then(data => {
          const role = data.profile?.role;
          setUserRole(role);
          if (role !== 'editor' && role !== 'admin') {
            router.push('/');
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, authLoading, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetchWithAuth(API_ENDPOINTS.blog.posts, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create blog post');
      }

      const newPost = await response.json();
      if (newPost.status === 'published') {
        router.push(`/blog/${newPost.slug}`);
      } else {
        router.push(`/dashboard/edit/${newPost.id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || (!userRole && isAuthenticated)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || (userRole !== 'editor' && userRole !== 'admin')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-500">You don&apos;t have permission to create posts.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-4xl font-bold mb-8 text-foreground">Create New Blog Post</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500 text-red-500 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">
            Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Enter blog post title"
            className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            required
          />
        </div>

        {/* Content - Lexical Editor */}
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">
            Content *
          </label>
          <LexicalEditor
            initialValue={formData.content_json}
            onChange={(jsonContent) => {
              setFormData((prev) => ({
                ...prev,
                content_json: jsonContent
              }));
            }}
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">
            Category
          </label>
          <CategorySelector
            selectedId={formData.category_id}
            onChange={(id) => setFormData((prev) => ({ ...prev, category_id: id }))}
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">
            Tags
          </label>
          <TagSelector
            selectedIds={formData.tag_ids}
            onChange={(ids) => setFormData((prev) => ({ ...prev, tag_ids: ids }))}
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="scheduled">Scheduled</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Disable Comments */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="comments_disabled"
            checked={formData.comments_disabled}
            onChange={(e) => setFormData((prev) => ({ ...prev, comments_disabled: e.target.checked }))}
            className="w-4 h-4 rounded border-input accent-primary"
          />
          <label htmlFor="comments_disabled" className="text-sm font-medium text-foreground cursor-pointer">
            Disable comments on this post
          </label>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {submitting ? 'Creating...' : 'Create Post'}
          </button>
          <Link
            href="/blog/posts"
            className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 font-medium"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
