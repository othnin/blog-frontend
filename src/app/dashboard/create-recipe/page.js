'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/authProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_ENDPOINTS } from '@/config/api';
import { fetchWithAuth } from '@/lib/tokenUtils';
import RecipeEditor from '@/components/RecipeEditor';

export default function CreateRecipePage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [userRole, setUserRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (isAuthenticated) {
      fetchWithAuth(API_ENDPOINTS.auth.me)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          const role = data?.profile?.role;
          setUserRole(role);
          if (role !== 'editor' && role !== 'admin') router.push('/');
        })
        .catch(() => {})
        .finally(() => setRoleLoading(false));
    }
  }, [isAuthenticated, authLoading, router]);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetchWithAuth(API_ENDPOINTS.recipes.create, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || 'Failed to create recipe');
        return;
      }
      const recipe = await res.json();
      if (recipe.status === 'published') {
        router.push(`/recipes/${recipe.slug}`);
      } else {
        router.push(`/dashboard/edit-recipe/${recipe.id}`);
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || roleLoading) {
    return <div className="container mx-auto px-4 py-8"><p className="text-muted-foreground">Loading…</p></div>;
  }

  if (!isAuthenticated || (userRole !== 'editor' && userRole !== 'admin')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-500">You don&apos;t have permission to create recipes.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/recipes" className="text-sm text-muted-foreground hover:text-foreground">
          ← My Recipes
        </Link>
        <h1 className="text-3xl font-bold text-foreground">New Recipe</h1>
      </div>
      <RecipeEditor
        onSubmit={handleSubmit}
        submitting={submitting}
        error={error}
      />
    </div>
  );
}
