'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/authProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_ENDPOINTS } from '@/config/api';
import { fetchWithAuth } from '@/lib/tokenUtils';
import LexicalEditor from '@/components/LexicalEditor';
import CategorySelector from '@/components/CategorySelector';

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
    status: 'draft'
  });

  useEffect(() => {
    // Check permissions
    if (!authLoading && (!isAuthenticated)) {
      console.log('⚠️ Not authenticated, redirecting to login');
      router.push('/login');
      return;
    }

    // Fetch user role if authenticated
    if (isAuthenticated && !authLoading) {
      const token = localStorage.getItem('access_token');
      console.log('🔍 Fetching user data from:', API_ENDPOINTS.auth.me);
      console.log('🔑 Token exists:', !!token);
      
      fetchWithAuth(API_ENDPOINTS.auth.me)
        .then(r => {
          console.log('📡 Response status:', r.status);
          return r.json();
        })
        .then(data => {
          console.log('📦 Full response data:', data);
          console.log('👤 Profile object:', data.profile);
          console.log('🎭 Role extracted:', data.profile?.role);
          
          setUserRole(data.profile?.role);
          
          const role = data.profile?.role;
          if (role !== 'editor' && role !== 'admin') {
            console.log('❌ User role not authorized. Role:', role);
            console.log('✅ Expected roles: editor or admin');
            router.push('/');
          } else {
            console.log('✅ User authorized with role:', role);
          }
        })
        .catch(err => {
          console.error('💥 Error fetching user:', err);
          console.error('Error details:', {
            message: err.message,
            stack: err.stack
          });
        });
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

      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Authentication token not found. Please login again.');
        router.push('/login');
        return;
      }

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
      router.push(`/blog/${newPost.slug}`);
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || (userRole !== 'editor' && userRole !== 'admin')) {
    console.log('🚫 PERMISSION CHECK FAILED');
    console.log('  isAuthenticated:', isAuthenticated);
    console.log('  userRole:', userRole);
    console.log('  userRole === "editor":', userRole === 'editor');
    console.log('  userRole === "admin":', userRole === 'admin');
    
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-500">You don&apos;t have permission to create posts.</p>
        <details style={{ marginTop: '1rem', padding: '1rem', border: '1px solid red' }}>
          <summary style={{ cursor: 'pointer' }}>Debug Info</summary>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
{JSON.stringify({
  isAuthenticated,
  userRole,
  hasToken: !!localStorage.getItem('access_token'),
  endpoint: API_ENDPOINTS.auth.me,
}, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
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

      <div className="mt-8 p-4 bg-green-500/10 border border-green-500 text-green-600 rounded-lg">
        <p className="font-medium mb-2">✓ Lexical Editor Integrated</p>
        <p className="text-sm">
          You can now use the visual Lexical editor to write your blog posts. The content is automatically saved as JSON format.
        </p>
      </div>
    </div>
  );
}
