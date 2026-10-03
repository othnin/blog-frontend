import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import RecipeDetailView from './RecipeDetailView';

const DJANGO_BASE_URL =
  process.env.DJANGO_BASE_URL ||
  process.env.NEXT_PUBLIC_DJANGO_BASE_URL ||
  'http://127.0.0.1:8001';

const AUTH_COOKIE = 'auth-token';

// Which recipes are visible depends on the viewer, so this cannot be prerendered.
export const dynamic = 'force-dynamic';

/**
 * Resolve a recipe server-side so a genuinely missing one returns a real HTTP
 * 404 rather than a client-rendered message served with a 200.
 *
 * "404 means gone" is not sufficient here: the public detail endpoint filters
 * to published recipes, so an author previewing their own draft also gets a 404.
 * Check the viewer's own recipes before concluding the page does not exist.
 */
export default async function RecipePage({ params }) {
  const { slug } = await params;

  const token = (await cookies()).get(AUTH_COOKIE)?.value;

  const publicRes = await fetch(`${DJANGO_BASE_URL}/api/recipes/${slug}/`, {
    cache: 'no-store',
  });

  if (publicRes.ok) {
    return <RecipeDetailView slug={slug} initialRecipe={await publicRes.json()} />;
  }

  if (publicRes.status === 404) {
    if (token) {
      const mineRes = await fetch(`${DJANGO_BASE_URL}/api/recipes/my-recipes/`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });

      if (mineRes.ok) {
        const mine = (await mineRes.json()).find((r) => r.slug === slug);
        if (mine) {
          return <RecipeDetailView slug={slug} initialRecipe={mine} />;
        }
      }
    }

    notFound();
  }

  // A backend problem is our fault, not a missing page: rethrow so error.jsx
  // handles it rather than reporting a false 404.
  throw new Error(`Failed to load recipe "${slug}" (backend responded ${publicRes.status})`);
}