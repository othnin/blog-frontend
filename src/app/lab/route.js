import { getDjangoBaseUrl } from '@/lib/backendUrl.mjs';

/**
 * The Thales DNA lab is a separate Vite application. The Django backend
 * builds it and serves the bundle at /thales/; this route exists only so
 * the site has a stable address to link to.
 *
 * The lab is deliberately loosely coupled. Nothing in the site knows anything
 * about its internals - not the API shape, not the bundle, not the build.
 * The whole integration is this redirect plus the two nav entries that point
 * at /lab, so pulling the lab out later means deleting this file and those
 * two links.
 *
 * A route handler rather than a page: `redirect()` in a server component
 * answers with 200 and a meta refresh, which flashes the site shell before
 * the browser gets to the lab. This answers with a plain 307.
 */
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.redirect(`${getDjangoBaseUrl()}/thales/`, 307);
}
