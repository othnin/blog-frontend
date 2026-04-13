'use client';

import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/config/api';

/**
 * CategorySelector — single-select dropdown for the 5 hardcoded categories.
 *
 * Props:
 *   selectedId   number | null             Currently selected category ID
 *   onChange     (id: number | null) => void  Called whenever selection changes
 */
export default function CategorySelector({ selectedId = null, onChange }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch(API_ENDPOINTS.blog.categories)
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  return (
    <select
      value={selectedId ?? ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
    >
      <option value="">— No category —</option>
      {categories.map((cat) => (
        <option key={cat.id} value={cat.id}>{cat.name}</option>
      ))}
    </select>
  );
}
