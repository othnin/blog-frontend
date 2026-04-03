'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/authProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_ENDPOINTS } from '@/config/api';
import { fetchWithAuth } from '@/lib/tokenUtils';
import { ChefHat } from 'lucide-react';

export default function MyRecipesPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const load = async () => {
      try {
        const [recipesRes, meRes] = await Promise.all([
          fetchWithAuth(API_ENDPOINTS.recipes.myRecipes),
          fetchWithAuth(API_ENDPOINTS.auth.me),
        ]);
        if (!recipesRes.ok) throw new Error('Failed to load recipes');
        setRecipes(await recipesRes.json());
        if (meRes.ok) {
          const me = await meRes.json();
          setUserRole(me.profile?.role);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated]);

  const handleDelete = async (recipe) => {
    if (!confirm(`Delete "${recipe.title}"? This cannot be undone.`)) return;
    setDeleting(recipe.id);
    try {
      const res = await fetchWithAuth(API_ENDPOINTS.recipes.delete(recipe.slug), { method: 'DELETE' });
      if (res.ok) setRecipes((prev) => prev.filter((r) => r.id !== recipe.id));
      else setError('Failed to delete recipe');
    } catch {
      setError('Failed to delete recipe');
    } finally {
      setDeleting(null);
    }
  };

  if (authLoading || loading) {
    return <div className="container mx-auto px-4 py-8"><p className="text-muted-foreground">Loading…</p></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Recipes</h1>
          <p className="text-sm text-muted-foreground mt-1">{recipes.length} recipe{recipes.length !== 1 ? 's' : ''}</p>
        </div>
        {(userRole === 'editor' || userRole === 'admin') && (
          <Link
            href="/dashboard/create-recipe"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium text-sm"
          >
            + New Recipe
          </Link>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500 text-red-500 rounded-lg text-sm">{error}</div>
      )}

      {recipes.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No recipes yet.</p>
          {(userRole === 'editor' || userRole === 'admin') && (
            <Link href="/dashboard/create-recipe" className="mt-3 inline-block text-primary hover:underline text-sm">
              Create your first recipe
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="flex items-start justify-between p-4 border rounded-lg bg-card hover:bg-card/80 transition-colors"
            >
              <div className="flex gap-3 items-start flex-1 min-w-0">
                {recipe.images?.[0] ? (
                  <img
                    src={recipe.images[0]}
                    alt=""
                    className="w-14 h-14 rounded-md object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                    <ChefHat className="w-6 h-6 text-muted-foreground/40" />
                  </div>
                )}
                <div className="min-w-0">
                  <Link
                    href={`/recipes/${recipe.slug}`}
                    className="text-base font-semibold text-primary hover:underline line-clamp-1"
                  >
                    {recipe.title}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(recipe.created_at).toLocaleDateString()}
                    {recipe.published_at && (
                      <> · Published {new Date(recipe.published_at).toLocaleDateString()}</>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className={`text-xs px-2 py-0.5 rounded capitalize ${
                      recipe.status === 'published'
                        ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                        : recipe.status === 'draft'
                        ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                        : 'bg-gray-500/20 text-gray-600'
                    }`}>
                      {recipe.status}
                    </span>
                    {recipe.view_count != null && (
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-700 dark:text-blue-400">
                        {recipe.view_count} views
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0 ml-3">
                <Link
                  href={`/dashboard/edit-recipe/${recipe.id}`}
                  className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(recipe)}
                  disabled={deleting === recipe.id}
                  className="px-3 py-1 text-sm bg-red-500/10 text-red-600 rounded hover:bg-red-500/20 disabled:opacity-50"
                >
                  {deleting === recipe.id ? '…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
