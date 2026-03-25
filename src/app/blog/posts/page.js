'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/authProvider';
import { API_ENDPOINTS } from '@/config/api';
import { Heart } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const LIKED_POSTS_KEY = 'liked_posts';

function getLikedPosts() {
  try { return new Set(JSON.parse(localStorage.getItem(LIKED_POSTS_KEY)) || []); }
  catch { return new Set(); }
}

function saveLikedPost(slug) {
  const liked = getLikedPosts();
  liked.add(slug);
  localStorage.setItem(LIKED_POSTS_KEY, JSON.stringify([...liked]));
}

export default function BlogPostsPage() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { isAuthenticated } = useAuth();

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const selectedCategory = searchParams.get('category') || '';
  const searchQuery = searchParams.get('search') || '';

  const fetchPosts = useCallback(async (categorySlug, search) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categorySlug) params.set('category', categorySlug);
      if (search) params.set('search', search);
      const url = params.toString()
        ? `${API_ENDPOINTS.blog.posts}?${params.toString()}`
        : API_ENDPOINTS.blog.posts;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch blog posts');
      const data = await response.json();
      setPosts(data);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLikedPosts(getLikedPosts());
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.blog.categories);
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    const fetchUserRole = async () => {
      if (!isAuthenticated) return;
      try {
        const response = await fetch(API_ENDPOINTS.auth.me);
        if (response.ok) {
          const userData = await response.json();
          setUserRole(userData.profile?.role);
        }
      } catch (err) {
        console.error('Error fetching user role:', err);
      }
    };

    fetchCategories();
    fetchUserRole();
  }, [isAuthenticated]);

  useEffect(() => {
    fetchPosts(selectedCategory, searchQuery);
  }, [selectedCategory, searchQuery, fetchPosts]);

  const handleLike = async (e, postSlug) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { setShowAuthDialog(true); return; }
    if (likedPosts.has(postSlug)) return;
    try {
      const response = await fetch(API_ENDPOINTS.blog.likePost(postSlug), { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setPosts((prev) =>
          prev.map((p) => p.slug === postSlug ? { ...p, like_count: data.like_count } : p)
        );
        saveLikedPost(postSlug);
        setLikedPosts((prev) => new Set([...prev, postSlug]));
      }
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleCategoryClick = (slug) => {
    const params = new URLSearchParams();
    if (slug && slug !== selectedCategory) {
      params.set('category', slug);
    }
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ''}`);
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-4 text-foreground">Blog Posts</h1>
        <div className="text-red-500 mb-4">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Join the conversation</DialogTitle>
            <DialogDescription>
              Please create an account if you want to contribute.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-start gap-2">
            <Link
              href="/register"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-medium"
              onClick={() => setShowAuthDialog(false)}
            >
              Create account
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 text-sm font-medium"
              onClick={() => setShowAuthDialog(false)}
            >
              Log in
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-foreground">Blog Posts</h1>
        {isAuthenticated && userRole === 'editor' && (
          <Link
            href="/dashboard/create-post"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Create Post
          </Link>
        )}
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => handleCategoryClick('')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              !selectedCategory
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.slug)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat.slug
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading posts...</p>
      ) : posts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {searchQuery ? 'No posts match your search.' : selectedCategory ? 'No posts found in this category.' : 'No blog posts yet. Check back soon!'}
          </p>
        </div>
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
              {post.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {post.categories.map((cat) => (
                    <span
                      key={cat.id}
                      className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded"
                    >
                      {cat.name}
                    </span>
                  ))}
                </div>
              )}
              <button
                onClick={(e) => handleLike(e, post.slug)}
                disabled={likedPosts.has(post.slug)}
                className={`flex items-center gap-1 text-sm transition-colors ${likedPosts.has(post.slug) ? 'text-red-500 cursor-default' : 'text-muted-foreground hover:text-red-500'}`}
              >
                <Heart className={`w-4 h-4 ${likedPosts.has(post.slug) ? 'fill-current' : ''}`} />
                {post.like_count}
              </button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
