/**
 * The Thales DNA lab is a separate Vite application served by Django at
 * /thales/. This route exists only so the site has a stable address to link
 * to.
 *
 * The redirect uses a relative Location header so it always stays on the
 * origin the browser actually requested. Building an absolute URL from
 * `request.url` (or from a Host header) breaks behind a reverse proxy: the
 * Next server sees its internal address (e.g. http://localhost:8080) and the
 * browser follows the redirect away from the public domain. A relative
 * Location is resolved by the browser against the public origin, which is
 * also the origin the HttpOnly auth cookie is scoped to.
 *
 * The lab is deliberately loosely coupled. Nothing in the site knows anything
 * about its internals - not the API shape, not the bundle, not the build.
 * The whole integration is this redirect, the /thales/* proxy in
 * src/middleware.ts, and the two nav entries that point at /lab.
 *
 * A route handler rather than a page: `redirect()` in a server component
 * answers with 200 and a meta refresh, which flashes the site shell before
 * the browser gets to the lab. This answers with a plain 307.
 */
export const dynamic = 'force-dynamic';

export function GET() {
  // A hand-built Response rather than Response.redirect(), which requires an
  // absolute URL. RFC 7231 allows a relative reference in Location, and every
  // browser resolves it against the request URL - i.e. the public domain.
  return new Response(null, {
    status: 307,
    headers: { Location: '/thales/' },
  });
}
