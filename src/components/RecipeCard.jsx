import Link from 'next/link';
import { Clock, ChefHat } from 'lucide-react';

function StarDisplay({ avg, count }) {
  if (avg == null) return <span className="text-xs text-muted-foreground">No ratings</span>;
  const stars = Math.round(avg);
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
      <span className="ml-1">{avg.toFixed(1)} ({count})</span>
    </span>
  );
}

export default function RecipeCard({ recipe }) {
  const heroImage = recipe.images?.[0];
  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

  const COURSE_LABELS = {
    breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', dessert: 'Dessert',
    appetizer: 'Appetizer', snack: 'Snack', drink: 'Drink', sauce: 'Sauce/Condiment',
    side: 'Side Dish', soup: 'Soup', salad: 'Salad',
  };
  const CUISINE_LABELS = {
    italian: 'Italian', mexican: 'Mexican', asian: 'Asian', american: 'American',
    mediterranean: 'Mediterranean', french: 'French', indian: 'Indian',
    middle_eastern: 'Middle Eastern', greek: 'Greek', japanese: 'Japanese',
    thai: 'Thai', chinese: 'Chinese', korean: 'Korean', other: 'Other',
  };

  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      className="block border rounded-lg bg-card hover:shadow-lg transition-shadow overflow-hidden"
    >
      {/* Hero image */}
      {heroImage ? (
        <div className="aspect-video overflow-hidden bg-muted">
          <img
            src={heroImage}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-video bg-muted flex items-center justify-center">
          <ChefHat className="w-10 h-10 text-muted-foreground/40" />
        </div>
      )}

      <div className="p-4">
        <h2 className="text-lg font-bold text-foreground mb-1 line-clamp-2">{recipe.title}</h2>

        <p className="text-xs text-muted-foreground mb-2">
          By {recipe.author?.username} • {new Date(recipe.created_at).toLocaleDateString()}
        </p>

        {recipe.description_text && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{recipe.description_text}</p>
        )}

        {/* Timing */}
        {totalTime > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
            <Clock className="w-3.5 h-3.5" />
            <span>{totalTime} min</span>
            {recipe.yield_amount && (
              <>
                <span className="mx-1">·</span>
                <span>{recipe.yield_amount} {recipe.yield_unit}</span>
              </>
            )}
          </div>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-1 mb-3">
          {recipe.cuisine_type && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
              {CUISINE_LABELS[recipe.cuisine_type] || recipe.cuisine_type}
            </span>
          )}
          {recipe.course && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
              {COURSE_LABELS[recipe.course] || recipe.course}
            </span>
          )}
          {recipe.dietary_labels?.slice(0, 2).map((d) => (
            <span key={d.id} className="text-xs px-2 py-0.5 rounded-full border border-green-500/40 text-green-700 dark:text-green-400">
              {d.name}
            </span>
          ))}
          {recipe.dietary_labels?.length > 2 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              +{recipe.dietary_labels.length - 2} more
            </span>
          )}
        </div>

        <StarDisplay avg={recipe.avg_rating} count={recipe.rating_count} />
      </div>
    </Link>
  );
}
