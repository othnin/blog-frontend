'use client';

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { fetchWithAuth } from '@/lib/tokenUtils';
import { API_ENDPOINTS } from '@/config/api';

/**
 * CategorySelector — multi-select with inline category creation.
 *
 * Props:
 *   selectedIds  number[]              Currently selected category IDs
 *   onChange     (ids: number[]) => void  Called whenever the selection changes
 */
export default function CategorySelector({ selectedIds = [], onChange }) {
  const [categories, setCategories] = useState([]);
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetch(API_ENDPOINTS.blog.categories)
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedCategories = categories.filter((c) => selectedIds.includes(c.id));

  const trimmed = input.trim();
  const filtered = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(trimmed.toLowerCase()) &&
      !selectedIds.includes(c.id)
  );
  const exactMatch = categories.some(
    (c) => c.name.toLowerCase() === trimmed.toLowerCase()
  );
  const showCreate = trimmed.length > 0 && !exactMatch;
  const showDropdown = open && (filtered.length > 0 || showCreate);

  const select = (cat) => {
    onChange([...selectedIds, cat.id]);
    setInput('');
    inputRef.current?.focus();
  };

  const remove = (id) => {
    onChange(selectedIds.filter((i) => i !== id));
  };

  const handleCreate = async () => {
    if (!trimmed || creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const response = await fetchWithAuth(API_ENDPOINTS.blog.categories, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      if (response.ok) {
        const newCat = await response.json();
        setCategories((prev) =>
          prev.some((c) => c.id === newCat.id) ? prev : [...prev, newCat]
        );
        onChange([...selectedIds, newCat.id]);
        setInput('');
        setOpen(false);
        inputRef.current?.focus();
      } else {
        const data = await response.json();
        setCreateError(data.detail || 'Failed to create category');
      }
    } catch {
      setCreateError('An error occurred');
    } finally {
      setCreating(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showCreate) handleCreate();
      else if (filtered.length === 1) select(filtered[0]);
    }
    if (e.key === 'Escape') setOpen(false);
    if (e.key === 'Backspace' && input === '' && selectedIds.length > 0) {
      remove(selectedIds[selectedIds.length - 1]);
    }
  };

  return (
    <div ref={containerRef} className="space-y-2">
      {/* Selected badges */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedCategories.map((cat) => (
            <span
              key={cat.id}
              className="inline-flex items-center gap-1 bg-primary/15 text-primary text-xs font-medium px-2.5 py-1 rounded-full border border-primary/20"
            >
              {cat.name}
              <button
                type="button"
                onClick={() => remove(cat.id)}
                className="ml-0.5 hover:text-primary/60 transition-colors"
                aria-label={`Remove ${cat.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
            setCreateError(null);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={
            selectedCategories.length === 0
              ? 'Search or type to create a category…'
              : 'Add another category…'
          }
          className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
        />

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute z-20 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-52 overflow-y-auto">
            {showCreate && (
              <button
                type="button"
                disabled={creating}
                onMouseDown={(e) => { e.preventDefault(); handleCreate(); }}
                className="w-full text-left px-3 py-2 text-sm font-medium text-primary hover:bg-accent disabled:opacity-50 transition-colors border-b border-border"
              >
                {creating ? 'Creating…' : `Create "${trimmed}"`}
              </button>
            )}
            {filtered.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); select(cat); }}
                className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {createError && (
        <p className="text-xs text-red-500">{createError}</p>
      )}
    </div>
  );
}
