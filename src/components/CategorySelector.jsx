'use client';

import { useState, useEffect } from 'react';
import MultipleSelector from '@/components/ui/multiple-selector';
import { fetchWithAuth } from '@/lib/tokenUtils';
import { API_ENDPOINTS } from '@/config/api';

/**
 * CategorySelector — multi-select with inline category creation.
 *
 * Props:
 *   selectedIds  number[]                 Currently selected category IDs
 *   onChange     (ids: number[]) => void  Called whenever the selection changes
 */
export default function CategorySelector({ selectedIds = [], onChange }) {
  const [allOptions, setAllOptions] = useState([]);

  useEffect(() => {
    fetch(API_ENDPOINTS.blog.categories)
      .then((r) => r.json())
      .then((cats) => setAllOptions(cats.map((c) => ({ value: String(c.id), label: c.name }))))
      .catch(() => {});
  }, []);

  const value = allOptions.filter((o) => selectedIds.includes(Number(o.value)));

  const handleChange = async (opts) => {
    const finalIds = [];
    const nextOptions = [...allOptions];

    for (const opt of opts) {
      // A newly-created entry has value === label (set by MultipleSelector creatable logic)
      if (opt.value === opt.label) {
        try {
          const res = await fetchWithAuth(API_ENDPOINTS.blog.categories, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: opt.label }),
          });
          if (res.ok) {
            const newCat = await res.json();
            const newOpt = { value: String(newCat.id), label: newCat.name };
            if (!nextOptions.find((o) => o.value === newOpt.value)) {
              nextOptions.push(newOpt);
            }
            finalIds.push(newCat.id);
          }
        } catch {
          // skip failed creation
        }
      } else {
        finalIds.push(Number(opt.value));
      }
    }

    setAllOptions(nextOptions);
    onChange(finalIds);
  };

  return (
    <MultipleSelector
      value={value}
      options={allOptions}
      onChange={handleChange}
      placeholder="Search or type to create a category…"
      creatable
      hideClearAllButton={false}
      emptyIndicator={
        <p className="text-center text-sm text-muted-foreground">No categories found.</p>
      }
    />
  );
}
