'use client';

import { useState } from 'react';

const SCALE_OPTIONS = [
  { label: '×½', value: 0.5 },
  { label: '×1', value: 1 },
  { label: '×2', value: 2 },
  { label: '×3', value: 3 },
];

function formatAmount(amount, scale) {
  const result = parseFloat(amount) * scale;
  // Up to 3 decimals, strip trailing zeros
  return parseFloat(result.toFixed(3)).toString();
}

export default function IngredientList({ ingredients, scale: scaleProp, onScaleChange }) {
  const [localScale, setLocalScale] = useState(1);
  const scale = scaleProp !== undefined ? scaleProp : localScale;
  const setScale = onScaleChange || setLocalScale;

  if (!ingredients || ingredients.length === 0) return null;

  return (
    <div>
      {/* Scale buttons — hidden when printing */}
      <div className="flex items-center gap-2 mb-4 print:hidden">
        <span className="text-sm text-muted-foreground">Scale:</span>
        {SCALE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setScale(opt.value)}
            className={`px-3 py-1 text-sm rounded-md border transition-colors ${
              scale === opt.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <ul className="space-y-2">
        {ingredients.map((ing) => (
          <li key={ing.id} className="flex items-baseline gap-2 text-sm">
            <span className="font-medium text-foreground min-w-[2.5rem] text-right tabular-nums">
              {formatAmount(ing.amount, scale)}
            </span>
            {ing.unit && (
              <span className="text-muted-foreground">{ing.unit}</span>
            )}
            <span className="text-foreground">{ing.name}</span>
            {ing.notes && (
              <span className="text-muted-foreground italic">({ing.notes})</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
