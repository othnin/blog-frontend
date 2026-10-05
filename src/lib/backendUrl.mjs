/**
 * Single source of truth for the Django backend URL.
 *
 * This value used to be copy-pasted into 37 route handlers and next.config.mjs,
 * each with its own silent fallback to http://127.0.0.1:8001. That default is
 * correct on a laptop and wrong everywhere else: in a Railway container,
 * 127.0.0.1 means the frontend container itself, where nothing listens on 8001.
 * The result was a site that starts fine, renders its shell, and then fails
 * every /api request with a connection error that never mentions a missing
 * variable.
 *
 * Two rules:
 *   - DJANGO_BASE_URL only. No NEXT_PUBLIC_ prefix: that would inline the
 *     internal hostname into the browser bundle for every visitor, and freeze it
 *     at build time so a variable change alone would have no effect.
 *   - No silent default in production. If it is unset we say so plainly, at
 *     startup or on the first request, instead of proxying to nowhere.
 */

const DEV_DEFAULT = 'http://127.0.0.1:8001';

function configured() {
  const value = process.env.DJANGO_BASE_URL;
  return value && value.trim() ? value.trim().replace(/\/+$/, '') : null;
}

/**
 * Resolve the backend URL, falling back to localhost.
 *
 * Never throws. Route handlers call this at module scope, and `next build`
 * evaluates those modules while collecting page data - before any Railway
 * service variable for the runtime necessarily exists. Throwing here would break
 * the build over a value that is only needed once the server is actually
 * serving.
 *
 * @returns {string} base URL with no trailing slash
 */
export function getDjangoBaseUrl() {
  return configured() || DEV_DEFAULT;
}

/**
 * Startup gate. Fails loudly when serving without DJANGO_BASE_URL.
 *
 * next.config.mjs calls this, so `next start` refuses to boot rather than
 * silently proxying /api to 127.0.0.1:8001 inside a container that has nothing
 * listening there. That one check covers every route handler and every page.
 *
 * The build is deliberately exempt: Railway only exposes service variables to
 * the build when they are configured for it, and failing the build over a
 * runtime value would be worse than the original problem.
 *
 * @param {{phase?: string}} [options] Next passes its phase when loading config.
 * @returns {string} base URL with no trailing slash
 */
export function requireDjangoBaseUrl(options = {}) {
  const url = configured();
  if (url) return url;

  const isBuild = options.phase === 'phase-production-build';
  if (!isBuild && process.env.NODE_ENV === 'production') {
    throw new Error(
      'DJANGO_BASE_URL is not set on the FRONTEND service.\n' +
        '\n' +
        'The frontend proxies /api/* to Django, so it has to know where Django ' +
        'runs. Left unset, every /api request would be proxied to 127.0.0.1:8001 ' +
        'inside the frontend container, where nothing is listening.\n' +
        '\n' +
        'Set it on the frontend service, not the backend:\n' +
        '  local:    http://localhost:8001\n' +
        '  Railway:  https://${{blog-backend.RAILWAY_PUBLIC_DOMAIN}}\n' +
        '\n' +
        'Prefer the backend PUBLIC domain over http://blog-backend:8080. Plain ' +
        'HTTP to the internal port makes SSLRedirectMiddleware 301 to an ' +
        'https:// URL that nothing serves, unless X-Forwarded-Proto survives ' +
        'the hop.\n' +
        '\n' +
        'This gate runs at serve time only, so the build stays green either way ' +
        '- a missing value shows up as a build that passes and then crash-loops.',
    );
  }

  return DEV_DEFAULT;
}

export default getDjangoBaseUrl;
