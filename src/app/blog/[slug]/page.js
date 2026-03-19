'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { API_ENDPOINTS } from '@/config/api';
import LexicalRenderer from '@/components/LexicalRenderer';

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params.slug;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/blog/posts/${slug}`);
        if (!response.ok) {
          throw new Error('Failed to fetch blog post');
        }
        const data = await response.json();
        setPost(data);
      } catch (err) {
        console.error('Error fetching post:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPost();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Loading post...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-red-500 mb-4">Error: {error}</div>
        <Link href="/blog/posts" className="text-primary hover:underline">
          ← Back to posts
        </Link>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Post not found</p>
        <Link href="/blog/posts" className="text-primary hover:underline">
          ← Back to posts
        </Link>
      </div>
    );
  }

  // Parse Lexical JSON content
  const contentData = (() => {
    try {
      return JSON.parse(post.content_json);
    } catch (e) {
      console.error('Error parsing content:', e);
      return null;
    }
  })();

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Link href="/blog/posts" className="text-primary hover:underline mb-4 inline-block">
        ← Back to posts
      </Link>

      <article className="bg-card rounded-lg p-6 md:p-8">
        {post.featured_image_url && (
          <img
            src={post.featured_image_url}
            alt={post.title}
            className="w-full h-96 object-cover rounded-lg mb-6"
          />
        )}

        <h1 className="text-4xl font-bold mb-4 text-foreground">{post.title}</h1>

        <div className="flex flex-wrap items-center gap-4 mb-6 text-muted-foreground">
          <span>By {post.author.username}</span>
          <span>•</span>
          <span>{new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
          <span>•</span>
          <span>{post.view_count} views</span>
        </div>

        {post.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.categories.map((cat) => (
              <span
                key={cat.id}
                className="text-sm bg-secondary text-secondary-foreground px-3 py-1 rounded"
              >
                {cat.name}
              </span>
            ))}
          </div>
        )}

        <div className="prose prose-invert max-w-none mb-6">
          <LexicalRenderer jsonContent={post.content_json} />
        </div>

        <div className="border-t pt-6 mt-6">
          <p className="text-sm text-muted-foreground">
            Status: <span className="capitalize">{post.status}</span>
          </p>
        </div>
      </article>
    </div>
  );
}
