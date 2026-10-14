'use client';

import { MICHELIN_RATING_OPTIONS } from '@/lib/michelin';

/**
 * RatingFilter — dropdown that filters map markers by Michelin rating.
 * Empty value means "All Ratings" (no filter applied).
 */
export default function RatingFilter({ value, onChange, id = 'rating-filter' }) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-sm font-medium text-muted-foreground">
        Michelin
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
      >
        {MICHELIN_RATING_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
