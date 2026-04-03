'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/authProvider';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { API_ENDPOINTS } from '@/config/api';
import { fetchWithAuth } from '@/lib/tokenUtils';
import RecipeEditor from '@/components/RecipeEditor';

export default function EditRecipePage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!isAuthenticated) return;
    fetchWithAuth(API_ENDPOINTS.recipes.myRecipe(id))
      .then((r) => {
        if (!r.ok) throw new Error('Recipe not found');
        return r.json();
      })
      .then(setRecipe)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isAuthenticated, authLoading, id, router]);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetchWithAuth(API_ENDPOINTS.recipes.update(id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || 'Failed to update recipe');
        return;
      }
      const updated = await res.json();
      if (updated.status === 'published') {
        router.push(`/recipes/${updated.slug}`);
      } else {
        router.push('/dashboard/recipes');
      }
    } catch {
      setError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return <div className="container mx-auto px-4 py-8"><p className="text-muted-foreground">Loading…</p></div>;
  }

  if (error && !recipe) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-500">{error}</p>
        <Link href="/dashboard/recipes" className="mt-4 inline-block text-primary hover:underline text-sm">
          ← My Recipes
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/recipes" className="text-sm text-muted-foreground hover:text-foreground">
          ← My Recipes
        </Link>
        <h1 className="text-3xl font-bold text-foreground">Edit Recipe</h1>
      </div>
      {recipe && (
        <RecipeEditor
          initialData={recipe}
          onSubmit={handleSubmit}
          submitting={submitting}
          error={error}
        />
      )}
    </div>
  );
}
