'use client';

import { useState } from 'react';
import LexicalEditor from '@/components/LexicalEditor';

export default function CommentEditor({ initialValue = '', onSubmit, onCancel, submitting }) {
  const [contentJson, setContentJson] = useState(initialValue || '');

  return (
    <div className="border border-input rounded-md p-3 space-y-2 bg-background">
      {/* key forces LexicalEditor to remount with fresh state when switching targets */}
      <LexicalEditor
        key={initialValue}
        initialValue={initialValue}
        onChange={(json) => setContentJson(json)}
        enableFootnotes={false}
      />
      <div className="flex gap-2 justify-end pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-3 py-1.5 text-sm rounded-md border border-input hover:bg-accent transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={() => onSubmit(contentJson)}
          disabled={submitting || !contentJson}
          className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {submitting ? 'Posting...' : 'Post Comment'}
        </button>
      </div>
    </div>
  );
}
