'use client';

import { useAuth } from '@/components/authProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/config/api';
import { fetchWithAuth } from '@/lib/tokenUtils';
import { ChefHat } from 'lucide-react';

export default function DashboardPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [myPosts, setMyPosts] = useState([]);
  const [myRecipes, setMyRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [username, setUsername] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    const fetchMyPosts = async () => {
      if (!isAuthenticated) return;

      try {
        setLoading(true);
        const [postsRes, meRes, recipesRes] = await Promise.all([
          fetch(API_ENDPOINTS.blog.myPosts),
          fetchWithAuth(API_ENDPOINTS.auth.me),
          fetchWithAuth(API_ENDPOINTS.recipes.myRecipes),
        ]);

        if (!postsRes.ok) throw new Error('Failed to fetch your posts');
        setMyPosts(await postsRes.json());

        if (meRes.ok) {
          const userData = await meRes.json();
          setUsername(userData.username);
          setUserRole(userData.profile?.role);
        }

        if (recipesRes.ok) setMyRecipes(await recipesRes.json());
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMyPosts();
  }, [isAuthenticated]);

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome, {username}!</p>
        <p className="text-sm text-muted-foreground capitalize">Role: {userRole}</p>
      </div>

      {(userRole === 'editor' || userRole === 'admin') && (
        <div className="mb-8 flex gap-3 flex-wrap">
          <Link
            href="/dashboard/create-post"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
          >
            + Create New Post
          </Link>
          <Link
            href="/dashboard/create-recipe"
            className="inline-block px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 font-medium"
          >
            + New Recipe
          </Link>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-4 text-foreground">Your Blog Posts</h2>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500 text-red-500 rounded-lg">
            {error}
          </div>
        )}

        {myPosts.length === 0 ? (
          <p className="text-muted-foreground">
            {(userRole === 'editor' || userRole === 'admin')
              ? "You haven't created any posts yet. Create your first post!"
              : 'No posts available'}
          </p>
        ) : (
          <div className="space-y-4">
            {myPosts.map((post) => (
              <div
                key={post.id}
                className="flex items-start justify-between p-4 border rounded-lg hover:bg-background/50 transition-colors"
              >
                <div className="flex-1">
                  <Link href={`/blog/${post.slug}`} className="text-lg font-semibold text-primary hover:underline">
                    {post.title}
                  </Link>
                  <p className="text-sm text-muted-foreground mt-1">
                    Created: {new Date(post.created_at).toLocaleDateString()}
                    {post.published_at && (
                      <> • Published: {new Date(post.published_at).toLocaleDateString()}</>
                    )}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded capitalize ${
                      post.status === 'published'
                        ? 'bg-green-500/20 text-green-700'
                        : post.status === 'draft'
                        ? 'bg-yellow-500/20 text-yellow-700'
                        : 'bg-gray-500/20 text-gray-700'
                    }`}>
                      {post.status}
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-700">
                      {post.view_count} views
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {(userRole === 'editor' || userRole === 'admin') && (
                    <>
                      <Link
                        href={`/dashboard/edit/${post.id}`}
                        className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
                      >
                        Edit
                      </Link>
                      {post.status !== 'published' && (
                        <button
                          className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
                          onClick={() => alert('Publish feature coming soon')}
                        >
                          Publish
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recipes section */}
      <div className="space-y-4 mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Your Recipes</h2>
          <Link href="/dashboard/recipes" className="text-sm text-primary hover:underline">View all →</Link>
        </div>

        {myRecipes.length === 0 ? (
          <p className="text-muted-foreground">
            {(userRole === 'editor' || userRole === 'admin')
              ? "No recipes yet. Create your first recipe!"
              : 'No recipes available'}
          </p>
        ) : (
          <div className="space-y-3">
            {myRecipes.slice(0, 5).map((recipe) => (
              <div
                key={recipe.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-background/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {recipe.images?.[0] ? (
                    <img src={recipe.images[0]} alt="" className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                      <ChefHat className="w-5 h-5 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <Link href={`/recipes/${recipe.slug}`} className="text-base font-semibold text-primary hover:underline line-clamp-1">
                      {recipe.title}
                    </Link>
                    <div className="flex gap-2 mt-0.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${
                        recipe.status === 'published'
                          ? 'bg-green-500/20 text-green-700'
                          : recipe.status === 'draft'
                          ? 'bg-yellow-500/20 text-yellow-700'
                          : 'bg-gray-500/20 text-gray-700'
                      }`}>
                        {recipe.status}
                      </span>
                    </div>
                  </div>
                </div>
                {(userRole === 'editor' || userRole === 'admin') && (
                  <Link
                    href={`/dashboard/edit-recipe/${recipe.id}`}
                    className="ml-3 px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 flex-shrink-0"
                  >
                    Edit
                  </Link>
                )}
              </div>
            ))}
            {myRecipes.length > 5 && (
              <Link href="/dashboard/recipes" className="block text-center text-sm text-primary hover:underline py-2">
                View all {myRecipes.length} recipes →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
