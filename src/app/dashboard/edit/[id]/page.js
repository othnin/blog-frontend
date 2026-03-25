'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/authProvider';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { API_ENDPOINTS } from '@/config/api';
import { fetchWithAuth } from '@/lib/tokenUtils';
import LexicalEditor from '@/components/LexicalEditor';
import CategorySelector from '@/components/CategorySelector';

export default function EditPostPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const postId = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [post, setPost] = useState(null);
  const [canEdit, setCanEdit] = useState(false);

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
    category_ids: [],
    status: 'draft'
  });

  // Check authentication and authorization
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && !authLoading) {
      const token = localStorage.getItem('access_token');
      fetchWithAuth(API_ENDPOINTS.auth.me, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => {
          setUserRole(data.profile?.role);
          if (data.profile?.role !== 'editor' && data.profile?.role !== 'admin') {
            router.push('/');
          }
        })
        .catch(err => {
          console.error('Error fetching user:', err);
          router.push('/');
        });
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch post data
  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('access_token');

        // Fetch the post by ID
        const response = await fetchWithAuth(`${API_ENDPOINTS.blog.posts}${postId}/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch post');
        }

        const postData = await response.json();
        setPost(postData);

        // Check if user can edit this post
        const isOwner = postData.author.id === JSON.parse(localStorage.getItem('user_id') || '0');
        const isAdmin = userRole === 'admin';

        if (!isOwner && !isAdmin) {
          setError('You do not have permission to edit this post');
          setCanEdit(false);
        } else {
          setCanEdit(true);
          // Populate form with post data
          setFormData({
            title: postData.title,
            content_json: postData.content_json,
            category_ids: postData.categories.map(c => c.id),
            status: postData.status
          });
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (postId && isAuthenticated && userRole) {
      fetchPost();
    }
  }, [postId, isAuthenticated, userRole]);

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

      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Authentication token not found. Please login again.');
        router.push('/login');
        return;
      }

      const response = await fetchWithAuth(`${API_ENDPOINTS.blog.posts}${postId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update blog post');
      }

      const updatedPost = await response.json();
      router.push(`/blog/${updatedPost.slug}`);
    } catch (err) {
      console.error('Error updating post:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !canEdit) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-500">You don&apos;t have permission to edit this post.</p>
        <Link href="/blog/posts" className="text-primary hover:underline mt-4 inline-block">
          ← Back to posts
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-4xl font-bold mb-8 text-foreground">Edit Blog Post</h1>

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

        {/* Categories */}
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">
            Categories
          </label>
          <CategorySelector
            selectedIds={formData.category_ids}
            onChange={(ids) => setFormData((prev) => ({ ...prev, category_ids: ids }))}
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

        {/* Submit Button */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {submitting ? 'Updating...' : 'Update Post'}
          </button>
          <Link
            href={post ? `/blog/${post.slug}` : '/blog/posts'}
            className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 font-medium"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
