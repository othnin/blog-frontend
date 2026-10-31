import { getDjangoBaseUrl } from '@/lib/backendUrl.mjs';

const DJANGO_BASE_URL = getDjangoBaseUrl();

// Public category image redirect. This has to be a route handler rather than
// going through the /api/:path* rewrite: config rewrites rebuild destinations
// from path segments and drop the trailing slash, so Django's CommonMiddleware
// (APPEND_SLASH) 301s back to this same URL forever. See the matching note for
// /django-admin/* in next.config.mjs and src/middleware.ts.
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { slug } = await params;

  try {
    const response = await fetch(
      `${DJANGO_BASE_URL}/api/blog/categories/${encodeURIComponent(slug)}/image/`,
      { redirect: 'manual' }
    );

    if (response.status >= 300 && response.status < 400) {
      const headers = {};
      const location = response.headers.get('location');
      if (location) headers.Location = location;
      // A cached redirect would pin an expired signed URL, so never cache this.
      headers['Cache-Control'] = response.headers.get('cache-control') || 'no-store';
      return new Response(null, { status: response.status, headers });
    }

    return new Response(await response.text(), {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
    });
  } catch (err) {
    console.error('[blog/categories/image] proxy error:', err.message);
    return new Response(
      JSON.stringify({ detail: `Proxy error: ${err.message}` }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
