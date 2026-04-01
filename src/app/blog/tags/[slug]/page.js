'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { API_ENDPOINTS } from '@/config/api';

export default function TagFilterPage() {
  const { slug } = useParams();
  const [posts, setPosts] = useState([]);
  const [tagName, setTagName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const [tagsRes, postsRes] = await Promise.all([
          fetch(API_ENDPOINTS.blog.tags),
          fetch(`${API_ENDPOINTS.blog.posts}?tags=${slug}`),
        ]);

        if (tagsRes.ok) {
          const allTags = await tagsRes.json();
          const match = allTags.find((t) => t.slug === slug);
          if (match) setTagName(match.name);
        }

        if (!postsRes.ok) throw new Error('Failed to fetch posts');
        setPosts(await postsRes.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/blog/posts" className="text-primary hover:underline text-sm">
          ← Back to all posts
        </Link>
        <h1 className="text-3xl font-bold mt-3 text-foreground">
          Posts tagged: <span className="text-primary">#{tagName || slug}</span>
        </h1>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading posts...</p>
      ) : error ? (
        <p className="text-red-500">Error: {error}</p>
      ) : posts.length === 0 ? (
        <p className="text-muted-foreground">No posts found with this tag.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="block p-6 border rounded-lg bg-card hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-bold mb-2 text-foreground">{post.title}</h2>
              <p className="text-sm text-muted-foreground mb-2">
                By {post.author.username} • {new Date(post.created_at).toLocaleDateString()}
              </p>
              {post.content_text && (
                <>
                  <hr className="border-border mb-3" />
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                    {post.content_text.length > 160
                      ? post.content_text.slice(0, 157).trimEnd() + '...'
                      : post.content_text}
                  </p>
                </>
              )}
              {post.category && (
                <div className="mb-2">
                  <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                    {post.category.name}
                  </span>
                </div>
              )}
              {post.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {post.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className={`text-xs px-2 py-0.5 rounded-full border ${
                        tag.slug === slug
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-primary/40 text-primary'
                      }`}
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
