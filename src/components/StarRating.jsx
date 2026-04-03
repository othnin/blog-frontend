'use client';

import { useState } from 'react';
import { useAuth } from '@/components/authProvider';
import { fetchWithAuth } from '@/lib/tokenUtils';
import { API_ENDPOINTS } from '@/config/api';

function StarIcon({ filled, half }) {
  return (
    <svg
      className={`w-5 h-5 ${filled ? 'text-amber-400' : 'text-muted-foreground/30'}`}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.5}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
      />
    </svg>
  );
}

export default function StarRating({ recipeId, initialAvg, initialCount, initialUserScore }) {
  const { isAuthenticated } = useAuth();
  const [avg, setAvg] = useState(initialAvg ?? null);
  const [count, setCount] = useState(initialCount ?? 0);
  const [userScore, setUserScore] = useState(initialUserScore ?? null);
  const [hovered, setHovered] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const displayScore = hovered ?? userScore;

  const handleRate = async (score) => {
    if (!isAuthenticated || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetchWithAuth(API_ENDPOINTS.recipes.rate(recipeId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score }),
      });
      if (res.ok) {
        const data = await res.json();
        setAvg(data.avg_rating);
        setCount(data.rating_count);
        setUserScore(data.user_score);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            disabled={!isAuthenticated || submitting}
            onClick={() => handleRate(star)}
            onMouseEnter={() => isAuthenticated && setHovered(star)}
            onMouseLeave={() => setHovered(null)}
            className={`transition-transform ${isAuthenticated ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
            title={isAuthenticated ? `Rate ${star} star${star > 1 ? 's' : ''}` : 'Log in to rate'}
          >
            <StarIcon filled={displayScore != null ? star <= displayScore : avg != null ? star <= Math.round(avg) : false} />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {avg != null ? (
            <>
              <span className="font-medium text-foreground">{avg.toFixed(1)}</span>
              {' '}({count} {count === 1 ? 'rating' : 'ratings'})
            </>
          ) : (
            'No ratings yet'
          )}
        </span>
      </div>
      {!isAuthenticated && (
        <p className="text-xs text-muted-foreground">
          <a href="/login" className="text-primary hover:underline">Log in</a> to rate this recipe.
        </p>
      )}
      {userScore && (
        <p className="text-xs text-muted-foreground">Your rating: {userScore} star{userScore > 1 ? 's' : ''}</p>
      )}
    </div>
  );
}
