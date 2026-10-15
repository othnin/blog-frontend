import { NextResponse } from 'next/server';

// Node runtime so DJANGO_BASE_URL is read from the environment at request time
// instead of being inlined into the edge bundle at build time.
export const runtime = 'nodejs';

// Django admin is a session-based app that owns its own login. Proxy it to the
// backend verbatim, preserving the trailing slash that every admin URL uses
// (and the query string, e.g. ?next=). This has to be a middleware rewrite
// rather than a next.config rewrite: config rewrites rebuild the destination
// from path segments and drop the trailing slash, which makes Django's
// APPEND_SLASH 301 fight the proxy into an infinite redirect loop.
export function middleware(request) {
  const { pathname } = request.nextUrl;

  // The authenticated area was renamed from /dashboard to /home. Keep old
  // links and bookmarks working with a permanent redirect that preserves the
  // sub-path and query string (e.g. /dashboard/edit/5 -> /home/edit/5).
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/dashboard/, '/home');
    return NextResponse.redirect(url, 308);
  }

  const backend = process.env.DJANGO_BASE_URL || 'http://127.0.0.1:8001';
  const target = new URL(
    request.nextUrl.pathname + request.nextUrl.search,
    backend.endsWith('/') ? backend : `${backend}/`,
  );
  return NextResponse.rewrite(target);
}

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*', '/django-admin', '/django-admin/:path*'],
};
