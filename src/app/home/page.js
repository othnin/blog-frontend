'use client';

import { useAuth } from '@/components/authProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/config/api';
import { fetchWithAuth } from '@/lib/tokenUtils';
import { ChefHat, MapPin, MessageSquare, Star, Clock } from 'lucide-react';

function ActivityFeedItem({ item }) {
  const href =
    item.target_type === 'post'
      ? `/blog/${item.slug}`
      : item.target_type === 'recipe'
      ? `/recipes/${item.slug}`
      : '/map';

  const Icon = item.type === 'rating' ? Star : MessageSquare;

  return (
    <div className="flex gap-3 p-4 border rounded-lg bg-card">
      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">
          {item.type === 'rating' ? 'Rated ' : 'Commented on '}
          <Link href={href} className="font-semibold text-primary hover:underline">
            {item.title}
          </Link>
          {item.type === 'rating' && item.score != null && (
            <span className="text-muted-foreground"> · {item.score}/5</span>
          )}
        </p>
        {item.excerpt && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.excerpt}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(item.created_at).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [myPosts, setMyPosts] = useState([]);
  const [myRecipes, setMyRecipes] = useState([]);
  const [activity, setActivity] = useState([]);
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
    const load = async () => {
      if (!isAuthenticated) return;

      try {
        setLoading(true);
        const meRes = await fetchWithAuth(API_ENDPOINTS.auth.me);
        let role = null;
        if (meRes.ok) {
          const userData = await meRes.json();
          setUsername(userData.username);
          role = userData.profile?.role;
          setUserRole(role);
        }

        const canCreate = role === 'editor' || role === 'admin';

        if (canCreate) {
          const [postsRes, recipesRes] = await Promise.all([
            fetchWithAuth(API_ENDPOINTS.blog.myPosts),
            fetchWithAuth(API_ENDPOINTS.recipes.myRecipes),
          ]);
          if (postsRes.ok) setMyPosts(await postsRes.json());
          if (recipesRes.ok) setMyRecipes(await recipesRes.json());
        } else {
          const activityRes = await fetchWithAuth(API_ENDPOINTS.auth.activity);
          if (activityRes.ok) setActivity(await activityRes.json());
        }
      } catch (err) {
        console.error('Error loading home data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isAuthenticated]);

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const canCreate = userRole === 'editor' || userRole === 'admin';
  const isAdmin = userRole === 'admin';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Home</h1>
        <p className="text-muted-foreground">Welcome, {username}!</p>
        <p className="text-sm text-muted-foreground capitalize">Role: {userRole}</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500 text-red-500 rounded-lg">
          {error}
        </div>
      )}

      {canCreate ? (
        <>
          <div className="mb-8 flex gap-3 flex-wrap">
            <Link
              href="/home/create-post"
              className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
            >
              + Create New Post
            </Link>
            <Link
              href="/home/create-recipe"
              className="inline-block px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 font-medium"
            >
              + New Recipe
            </Link>
            <Link
              href="/home/locations"
              className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 font-medium"
            >
              <MapPin className="w-4 h-4" />
              Manage Locations
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="inline-block px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium"
              >
                Admin Panel
              </Link>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4 text-foreground">Your Blog Posts</h2>

            {myPosts.length === 0 ? (
              <p className="text-muted-foreground">
                You haven&apos;t created any posts yet. Create your first post!
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
                      <Link
                        href={`/home/edit/${post.id}`}
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 mt-10">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Your Recipes</h2>
              <Link href="/home/recipes" className="text-sm text-primary hover:underline">View all →</Link>
            </div>

            {myRecipes.length === 0 ? (
              <p className="text-muted-foreground">No recipes yet. Create your first recipe!</p>
            ) : (
              <div className="space-y-3">
                {myRecipes.slice(0, 5).map((recipe) => (
                  <div
                    key={recipe.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-background/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {recipe.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
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
                    <Link
                      href={`/home/edit-recipe/${recipe.id}`}
                      className="ml-3 px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 flex-shrink-0"
                    >
                      Edit
                    </Link>
                  </div>
                ))}
                {myRecipes.length > 5 && (
                  <Link href="/home/recipes" className="block text-center text-sm text-primary hover:underline py-2">
                    View all {myRecipes.length} recipes →
                  </Link>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Your Activity</h2>

          {activity.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No activity yet.</p>
              <p className="text-sm mt-1">
                Comment on a post or rate a recipe and it will show up here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activity.map((item, idx) => (
                <ActivityFeedItem key={`${item.type}-${item.target_type}-${item.target_id}-${idx}`} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
