import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import BlogDetailView from './BlogDetailView';
import { getDjangoBaseUrl } from '@/lib/backendUrl.mjs';


const AUTH_COOKIE = 'auth-token';

// The post is resolved per-request because the visible set depends on who is
// asking: an author viewing their own draft gets a 200 while everyone else
// gets a 404. Must never be prerendered at build time.
export const dynamic = 'force-dynamic';

/**
 * Resolve a post server-side so a genuinely missing post returns a real HTTP
 * 404 instead of a client-rendered "Post not found" page served with a 200.
 *
 * That matters for SEO: search engines treat a 200-with-no-content as a soft
 * 404, so deleted and renamed posts could stay indexed as real pages.
 *
 * The lookup cannot simply be "404 means gone", because drafts are invisible to
 * the public API. An author must still be able to open their own unpublished
 * post by URL, so on a 404 we check the viewer's own posts before giving up.
 */
export default async function BlogPostPage({ params }) {
  const { slug } = await params;

  const djangoBaseUrl = getDjangoBaseUrl();
  const token = (await cookies()).get(AUTH_COOKIE)?.value;

  // Deliberately unauthenticated, mirroring the original browser-side fetch:
  // the public detail endpoint returns published posts only.
  const publicRes = await fetch(`${djangoBaseUrl}/api/blog/posts/${slug}`, {
    cache: 'no-store',
  });

  if (publicRes.ok) {
    return <BlogDetailView slug={slug} initialPost={await publicRes.json()} />;
  }

  if (publicRes.status === 404) {
    if (token) {
      const mineRes = await fetch(`${djangoBaseUrl}/api/blog/my-posts`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });

      if (mineRes.ok) {
        const owned = (await mineRes.json()).find((p) => p.slug === slug);
        if (owned) {
          return <BlogDetailView slug={slug} initialPost={owned} />;
        }
      }
    }

    notFound();
  }

  // Anything else - a backend outage, a 5xx, a redirect loop - is our fault, not
  // a missing page. Rethrowing sends it to error.jsx instead of falsely
  // reporting 404 to a visitor and to search engines.
  throw new Error(`Failed to load post "${slug}" (backend responded ${publicRes.status})`);
}