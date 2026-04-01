'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/tokenUtils';
import { API_ENDPOINTS } from '@/config/api';

/**
 * TagSelector — multi-select pill badges with inline tag creation.
 *
 * Props:
 *   selectedIds  number[]                 Currently selected tag IDs
 *   onChange     (ids: number[]) => void  Called whenever selection changes
 */
export default function TagSelector({ selectedIds = [], onChange }) {
  const [tags, setTags] = useState([]);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch(API_ENDPOINTS.blog.tags)
      .then((r) => r.json())
      .then(setTags)
      .catch(() => {});
  }, []);

  const handleToggle = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const res = await fetchWithAuth(API_ENDPOINTS.blog.tags, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const tag = await res.json();
        setTags((prev) => {
          if (prev.find((t) => t.id === tag.id)) return prev;
          return [...prev, tag].sort((a, b) => a.name.localeCompare(b.name));
        });
        onChange([...selectedIds, tag.id]);
        setNewName('');
      }
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-3">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const active = selectedIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleToggle(tag.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                #{tag.name}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreate(); } }}
          placeholder="New tag name…"
          className="flex-1 px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={!newName.trim() || creating}
          className="px-3 py-2 bg-secondary text-secondary-foreground rounded-md text-sm hover:bg-secondary/80 disabled:opacity-50"
        >
          {creating ? 'Adding…' : 'Add'}
        </button>
      </div>
    </div>
  );
}
