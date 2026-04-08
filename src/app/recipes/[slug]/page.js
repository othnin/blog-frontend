'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/authProvider';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_ENDPOINTS } from '@/config/api';
import { fetchWithAuth } from '@/lib/tokenUtils';
import IngredientList from '@/components/IngredientList';
import StarRating from '@/components/StarRating';
import RecipeCommentThread from '@/components/RecipeCommentThread';
import { Clock, ChefHat, Eye, User, Printer } from 'lucide-react';

const CUISINE_LABELS = {
  italian: 'Italian', mexican: 'Mexican', asian: 'Asian', american: 'American',
  mediterranean: 'Mediterranean', french: 'French', indian: 'Indian',
  middle_eastern: 'Middle Eastern', greek: 'Greek', japanese: 'Japanese',
  thai: 'Thai', chinese: 'Chinese', korean: 'Korean', other: 'Other',
};
const COURSE_LABELS = {
  breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', dessert: 'Dessert',
  appetizer: 'Appetizer', snack: 'Snack', drink: 'Drink', sauce: 'Sauce/Condiment',
  side: 'Side Dish', soup: 'Soup', salad: 'Salad',
};

function formatAmount(amount, scale) {
  return parseFloat((parseFloat(amount) * scale).toFixed(3)).toString();
}

export default function RecipeDetailPage() {
  const { slug } = useParams();
  const { isAuthenticated, username } = useAuth();
  const router = useRouter();

  const [recipe, setRecipe] = useState(null);
  const [userRating, setUserRating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [deleting, setDeleting] = useState(false);

  // Scale state lifted here so Print can read it
  const [scale, setScale] = useState(1);

  // Print state
  const [printCompact, setPrintCompact] = useState(false);
  const [pendingPrint, setPendingPrint] = useState(false);

  useEffect(() => {
    if (pendingPrint) {
      if (printCompact) document.body.classList.add('print-compact');
      window.print();
      document.body.classList.remove('print-compact');
      setPendingPrint(false);
    }
  }, [pendingPrint]);

  const handlePrint = (compact) => {
    setPrintCompact(compact);
    setPendingPrint(true);
  };

  useEffect(() => {
    fetch(API_ENDPOINTS.recipes.detail(slug))
      .then((r) => { if (!r.ok) throw new Error('Recipe not found'); return r.json(); })
      .then(setRecipe)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!isAuthenticated || !recipe) return;
    fetch(API_ENDPOINTS.recipes.rating(recipe.id))
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setUserRating(d.user_score ?? null); })
      .catch(() => {});
    fetchWithAuth(API_ENDPOINTS.auth.me)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setUserRole(d.profile?.role); })
      .catch(() => {});
  }, [isAuthenticated, recipe]);

  const handleDelete = async () => {
    if (!confirm('Delete this recipe? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const res = await fetchWithAuth(API_ENDPOINTS.recipes.delete(slug), { method: 'DELETE' });
      if (res.ok) router.push('/recipes');
      else setError('Failed to delete recipe');
    } catch {
      setError('Failed to delete recipe');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8"><p className="text-muted-foreground">Loading…</p></div>;
  }
  if (error || !recipe) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-500">{error || 'Recipe not found'}</p>
        <Link href="/recipes" className="mt-4 inline-block text-primary hover:underline text-sm">← Recipes</Link>
      </div>
    );
  }

  const canEdit = isAuthenticated && (
    recipe.author?.username === username || userRole === 'admin'
  );
  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">

      {/* Print-only: page URL */}
      <div className="hidden print:block text-xs text-muted-foreground mb-4">
        {typeof window !== 'undefined' && window.location.href}
      </div>

      {/* Breadcrumb — hidden when printing */}
      <div className="mb-4 text-sm text-muted-foreground print:hidden">
        <Link href="/recipes" className="hover:text-foreground">Recipes</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{recipe.title}</span>
      </div>

      {/* Hero image — hidden in compact print */}
      {recipe.images?.length > 0 && (
        <div className={`mb-6 ${printCompact ? 'print:hidden' : ''}`}>
          <div className="rounded-xl overflow-hidden bg-muted aspect-video mb-2">
            <img
              src={recipe.images[selectedImage]}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
          </div>
          {/* Thumbnail gallery — always hidden when printing */}
          {recipe.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 print:hidden">
              {recipe.images.map((url, i) => (
                <button
                  key={url + i}
                  onClick={() => setSelectedImage(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === i ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Title + meta */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">{recipe.title}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
          <span className="flex items-center gap-1.5">
            {recipe.author?.avatar_url ? (
              <img src={recipe.author.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <User className="w-4 h-4" />
            )}
            {recipe.author?.username}
          </span>
          <span>{new Date(recipe.created_at).toLocaleDateString()}</span>
          {recipe.view_count != null && (
            <span className="flex items-center gap-1 print:hidden">
              <Eye className="w-3.5 h-3.5" /> {recipe.view_count} views
            </span>
          )}
        </div>

        {/* Timing bar */}
        {(recipe.prep_time_minutes || recipe.cook_time_minutes || recipe.yield_amount) && (
          <div className="flex flex-wrap gap-4 py-3 border-y border-border text-sm mb-3">
            {recipe.prep_time_minutes && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Prep</p>
                <p className="font-semibold text-foreground">{recipe.prep_time_minutes} min</p>
              </div>
            )}
            {recipe.cook_time_minutes && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Cook</p>
                <p className="font-semibold text-foreground">{recipe.cook_time_minutes} min</p>
              </div>
            )}
            {totalTime > 0 && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total</p>
                <p className="font-semibold text-foreground">{totalTime} min</p>
              </div>
            )}
            {recipe.yield_amount && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Yield</p>
                <p className="font-semibold text-foreground">{recipe.yield_amount} {recipe.yield_unit}</p>
              </div>
            )}
            {/* Print-only scaled yield — shown only when scale is not 1 */}
            {recipe.yield_amount && scale !== 1 && (
              <div className="hidden print:block text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Yield (×{scale})</p>
                <p className="font-semibold text-foreground">
                  {formatAmount(recipe.yield_amount, scale)} {recipe.yield_unit}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Badges — hidden when printing */}
        <div className="flex flex-wrap gap-2 mb-3 print:hidden">
          {recipe.cuisine_type && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
              {CUISINE_LABELS[recipe.cuisine_type] || recipe.cuisine_type}
            </span>
          )}
          {recipe.course && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
              {COURSE_LABELS[recipe.course] || recipe.course}
            </span>
          )}
          {recipe.dietary_labels?.map((d) => (
            <span key={d.id} className="text-xs px-2.5 py-1 rounded-full border border-green-500/40 text-green-700 dark:text-green-400">
              {d.name}
            </span>
          ))}
          {recipe.tags?.map((t) => (
            <span key={t.id} className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
              #{t.name}
            </span>
          ))}
        </div>

        {/* Edit / Delete / Print — hidden when printing */}
        <div className="flex gap-2 print:hidden">
          {canEdit && (
            <>
              <Link
                href={`/dashboard/edit-recipe/${recipe.id}`}
                className="px-3 py-1.5 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
              >
                Edit
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 text-sm bg-red-500/10 text-red-600 rounded-md hover:bg-red-500/20 disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </>
          )}
          <button
            onClick={() => handlePrint(false)}
            className="px-3 py-1.5 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 flex items-center gap-1.5"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button
            onClick={() => handlePrint(true)}
            className="px-3 py-1.5 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 flex items-center gap-1.5"
          >
            <Printer className="h-4 w-4" />
            Print Compact
          </button>
        </div>
      </div>

      {/* Description */}
      {recipe.description && (
        <p className="text-base text-foreground/90 leading-relaxed mb-8">{recipe.description}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        {/* Ingredients */}
        {recipe.ingredients?.length > 0 && (
          <div className="md:col-span-1">
            <h2 className="text-xl font-semibold text-foreground mb-4">Ingredients</h2>
            <IngredientList
              ingredients={recipe.ingredients}
              scale={scale}
              onScaleChange={setScale}
            />
          </div>
        )}

        {/* Instructions */}
        {recipe.instructions?.length > 0 && (
          <div className={recipe.ingredients?.length > 0 ? 'md:col-span-2' : 'md:col-span-3'}>
            <h2 className="text-xl font-semibold text-foreground mb-4">Instructions</h2>
            <ol className="space-y-5">
              {recipe.instructions.map((step) => (
                <li key={step.id} className="flex gap-4">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center mt-0.5">
                    {step.step_number}
                  </span>
                  <div>
                    {step.title && <p className="font-semibold text-foreground mb-1">{step.title}</p>}
                    <p className="text-foreground/90 leading-relaxed">{step.content}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* Notes — hidden in compact print */}
      {recipe.notes && (
        <div className={`mb-10 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg ${printCompact ? 'print:hidden' : ''}`}>
          <h2 className="text-base font-semibold text-foreground mb-2">Notes</h2>
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{recipe.notes}</p>
        </div>
      )}

      {/* Star Rating — hidden when printing */}
      <div className="mb-10 pb-8 border-b border-border print:hidden">
        <h2 className="text-xl font-semibold text-foreground mb-3">Rate this recipe</h2>
        <StarRating
          recipeId={recipe.id}
          initialAvg={recipe.avg_rating}
          initialCount={recipe.rating_count}
          initialUserScore={userRating}
        />
      </div>

      {/* Comments — hidden when printing */}
      <div className="print:hidden">
        <RecipeCommentThread recipeId={recipe.id} commentsDisabled={recipe.comments_disabled} />
      </div>
    </div>
  );
}
