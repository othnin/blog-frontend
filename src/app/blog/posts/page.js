'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/authProvider';
import { API_ENDPOINTS } from '@/config/api';

export default function BlogPostsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_ENDPOINTS.blog.posts);
        if (!response.ok) {
          throw new Error('Failed to fetch blog posts');
        }
        const data = await response.json();
        setPosts(data);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Also fetch user role if authenticated — the /api/auth/me route handler
    // reads the HTTP-only cookie and adds the Bearer token server-side.
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

    fetchPosts();
    fetchUserRole();
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-4 text-foreground">Blog Posts</h1>
        <p className="text-muted-foreground">Loading posts...</p>
      </div>
    );
  }

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
      <div className="flex justify-between items-center mb-8">
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

      {posts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No blog posts yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="block p-6 border rounded-lg bg-card hover:shadow-lg transition-shadow"
            >
              {post.featured_image_url && (
                <img
                  src={post.featured_image_url}
                  alt={post.title}
                  className="w-full h-40 object-cover rounded-md mb-4"
                />
              )}
              <h2 className="text-xl font-bold mb-2 text-foreground">{post.title}</h2>
              <p className="text-sm text-muted-foreground mb-2">
                By {post.author.username} • {new Date(post.created_at).toLocaleDateString()}
              </p>
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
