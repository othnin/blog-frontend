/**
 * The Thales DNA lab is a separate Vite application served by Django at
 * /thales/. This route exists only so the site has a stable address to link
 * to.
 *
 * The redirect stays on the incoming request's origin: /thales/* is proxied
 * through this Next.js app by src/middleware.ts, which keeps the lab on the
 * same origin as the HttpOnly auth cookie. Redirecting to DJANGO_BASE_URL
 * instead would send the browser to a different host, where it has no session,
 * and the lab would bounce straight back to the login page.
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

export function GET(request) {
  // Response.redirect() requires an absolute URL. Build it from the incoming
  // request so the redirect stays on the site's own origin (and therefore
  // keeps the auth cookie) rather than jumping to the Django host.
  return Response.redirect(new URL('/thales/', request.url), 307);
}
