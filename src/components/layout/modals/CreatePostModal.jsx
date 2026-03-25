'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import LexicalEditor from '@/components/LexicalEditor';
import CategorySelector from '@/components/CategorySelector';
import { API_ENDPOINTS } from '@/config/api';
import { fetchWithAuth } from '@/lib/tokenUtils';
import { LucideFileEdit, LucideSend, User } from 'lucide-react';
import { useAuth } from '@/components/authProvider';

const EMPTY_CONTENT = JSON.stringify({
  root: {
    children: [{ children: [{ text: '', type: 'text' }], type: 'paragraph' }],
    type: 'root',
  },
});

export default function CreatePostModal({ open, onOpenChange }) {
  const router = useRouter();
  const { avatar, username } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content_json: EMPTY_CONTENT,
    featured_image_url: '',
    category_ids: [],
  });

  const resetForm = () => {
    setFormData({
      title: '',
      content_json: EMPTY_CONTENT,
      featured_image_url: '',
      category_ids: [],
    });
    setError(null);
  };

  const handleOpenChange = (isOpen) => {
    if (!isOpen) resetForm();
    onOpenChange(isOpen);
  };

  const handleSave = async (status) => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetchWithAuth(API_ENDPOINTS.blog.posts, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, status }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to create post');
      }

      const newPost = await response.json();
      resetForm();
      onOpenChange(false);
      if (status === 'published') {
        router.push(`/blog/${newPost.slug}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-full overflow-hidden bg-muted flex items-center justify-center">
              {avatar ? (
                <img src={avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <DialogTitle>Create New Post</DialogTitle>
              <DialogDescription className="text-xs">
                Posting as {username}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500 text-red-500 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter blog post title"
              className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
          </div>

          {/* Featured Image URL */}
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">
              Featured Image URL
            </label>
            <input
              type="url"
              name="featured_image_url"
              value={formData.featured_image_url}
              onChange={handleInputChange}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">
              Categories
            </label>
            <CategorySelector
              selectedIds={formData.category_ids}
              onChange={(ids) => setFormData((prev) => ({ ...prev, category_ids: ids }))}
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">
              Content *
            </label>
            <LexicalEditor
              initialValue={formData.content_json}
              onChange={(json) =>
                setFormData((prev) => ({ ...prev, content_json: json }))
              }
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t mt-2">
          <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
          >
            Discard
          </Button>

          <div className="flex gap-2">
            <Button
              onClick={() => handleSave('draft')}
              disabled={submitting}
              variant="outline"
            >
              <LucideFileEdit className="h-4 w-4 mr-1" />
              {submitting ? 'Saving...' : 'Save as Draft'}
            </Button>
            <Button
              onClick={() => handleSave('published')}
              disabled={submitting}
            >
              <LucideSend className="h-4 w-4 mr-1" />
              {submitting ? 'Publishing...' : 'Publish'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
