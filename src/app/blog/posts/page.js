'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/authProvider';
import { API_ENDPOINTS } from '@/config/api';

export default function BlogPostsPage() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const { isAuthenticated } = useAuth();

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const selectedCategory = searchParams.get('category') || '';
  const searchQuery = searchParams.get('search') || '';

  const fetchPosts = useCallback(async (categorySlug, search) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categorySlug) params.set('category', categorySlug);
      if (search) params.set('search', search);
      const url = params.toString()
        ? `${API_ENDPOINTS.blog.posts}?${params.toString()}`
        : API_ENDPOINTS.blog.posts;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch blog posts');
      const data = await response.json();
      setPosts(data);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.blog.categories);
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    const fetchUserRole = async () => {
      if (!isAuthenticated) return;
      try {
        const response = await fetch(API_ENDPOINTS.auth.me);
        if (response.ok) {
          const userData = await response.json();
          setUserRole(userData.profile?.role);
        }
      } catch (err) {
        console.error('Error fetching user role:', err);
      }
    };

    fetchCategories();
    fetchUserRole();
  }, [isAuthenticated]);

  useEffect(() => {
    fetchPosts(selectedCategory, searchQuery);
  }, [selectedCategory, searchQuery, fetchPosts]);

  const handleCategoryClick = (slug) => {
    const params = new URLSearchParams();
    if (slug && slug !== selectedCategory) {
      params.set('category', slug);
    }
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ''}`);
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-4 text-foreground">Blog Posts</h1>
        <div className="text-red-500 mb-4">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-foreground">Blog Posts</h1>
        {isAuthenticated && userRole === 'editor' && (
          <Link
            href="/dashboard/create-post"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Create Post
          </Link>
        )}
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => handleCategoryClick('')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              !selectedCategory
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.slug)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat.slug
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading posts...</p>
      ) : posts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {searchQuery ? 'No posts match your search.' : selectedCategory ? 'No posts found in this category.' : 'No blog posts yet. Check back soon!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="block p-6 border rounded-lg bg-card hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-bold mb-2 text-foreground">{post.title}</h2>
              <p className="text-sm text-muted-foreground mb-2">
                By {post.author.username} • {new Date(post.created_at).toLocaleDateString()}
              </p>
              {post.content_text && (
                <>
                  <hr className="border-border mb-3" />
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                    {post.content_text.length > 160
                      ? post.content_text.slice(0, 157).trimEnd() + '...'
                      : post.content_text}
                  </p>
                </>
              )}
              {post.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {post.categories.map((cat) => (
                    <span
                      key={cat.id}
                      className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded"
                    >
                      {cat.name}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Views: {post.view_count}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
