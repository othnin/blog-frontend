'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/authProvider';
import { API_ENDPOINTS } from '@/config/api';
import { fetchWithAuth } from '@/lib/tokenUtils';
import { Heart } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const STATUS_STYLES = {
  draft:     'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  published: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  archived:  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
};

function StatusBadge({ status }) {
  return (
    <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded capitalize ${STATUS_STYLES[status] ?? STATUS_STYLES.draft}`}>
      {status}
    </span>
  );
}

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
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [myPosts, setMyPosts] = useState([]);
  const [myPostsLoading, setMyPostsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const selectedCategory = searchParams.get('category') || '';
  const selectedTag = searchParams.get('tag') || '';
  const searchQuery = searchParams.get('search') || '';

  const fetchPosts = useCallback(async (categorySlug, tagSlug, search) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categorySlug) params.set('category', categorySlug);
      if (tagSlug) params.set('tags', tagSlug);
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

    const fetchTags = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.blog.tags);
        if (response.ok) setTags(await response.json());
      } catch (err) {
        console.error('Error fetching tags:', err);
      }
    };

    fetchCategories();
    fetchTags();
    fetchUserRole();
  }, [isAuthenticated]);

  const fetchMyPosts = useCallback(async () => {
    setMyPostsLoading(true);
    try {
      const res = await fetchWithAuth(API_ENDPOINTS.blog.myPosts);
      if (!res.ok) throw new Error('Failed to fetch your posts');
      setMyPosts(await res.json());
    } catch (err) {
      console.error('Error fetching my posts:', err);
    } finally {
      setMyPostsLoading(false);
    }
  }, []);

  const handleToggleMyPosts = () => {
    const next = !showMyPosts;
    setShowMyPosts(next);
    if (next) fetchMyPosts();
  };

  useEffect(() => {
    fetchPosts(selectedCategory, selectedTag, searchQuery);
  }, [selectedCategory, selectedTag, searchQuery, fetchPosts]);

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
    const params = new URLSearchParams(searchParams.toString());
    params.delete('category');
    if (slug) params.set('category', slug);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleTagClick = (slug) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('tag');
    if (slug) params.set('tag', slug);
    router.push(`${pathname}?${params.toString()}`);
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
        {isAuthenticated && (userRole === 'editor' || userRole === 'admin') && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleMyPosts}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showMyPosts
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {showMyPosts ? 'All Posts' : 'My Posts'}
            </button>
            <Link
              href="/dashboard/create-post"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-medium"
            >
              Create Post
            </Link>
          </div>
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

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => handleTagClick('')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              !selectedTag
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            All tags
          </button>
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => handleTagClick(tag.slug)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedTag === tag.slug
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              #{tag.name}
            </button>
          ))}
        </div>
      )}

      {showMyPosts ? (
        myPostsLoading ? (
          <p className="text-muted-foreground">Loading your posts...</p>
        ) : myPosts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">You haven&apos;t created any posts yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myPosts.map((post) => (
              <Link
                key={post.id}
                href={post.status === 'published' ? `/blog/${post.slug}` : `/dashboard/edit/${post.id}`}
                className="block p-6 border rounded-lg bg-card hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h2 className="text-xl font-bold text-foreground">{post.title}</h2>
                  <StatusBadge status={post.status} />
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {new Date(post.created_at).toLocaleDateString()}
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
              </Link>
            ))}
          </div>
        )
      ) : loading ? (
        <p className="text-muted-foreground">Loading posts...</p>
      ) : posts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {searchQuery ? 'No posts match your search.' : selectedCategory ? 'No posts found in this category.' : selectedTag ? 'No posts found with this tag.' : 'No blog posts yet. Check back soon!'}
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
              {post.category && (
                <div className="mb-2">
                  <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                    {post.category.name}
                  </span>
                </div>
              )}
              {post.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="text-xs px-2 py-0.5 rounded-full border border-primary/40 text-primary"
                      onClick={(e) => { e.preventDefault(); handleTagClick(tag.slug); }}
                    >
                      #{tag.name}
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
