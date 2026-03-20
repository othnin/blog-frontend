function dispatchSessionExpired() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth:session-expired'));
  }
}

/**
 * Ask the Next.js /api/token/refresh route handler to exchange the current
 * HTTP-only refresh-token cookie for a fresh access token (and rotated
 * refresh token).  The route handler reads/writes the cookies server-side,
 * so no token values are ever exposed to client-side JavaScript.
 *
 * Returns true on success, false on any failure.
 */
export async function refreshAccessToken() {
  try {
    const response = await fetch('/api/token/refresh', { method: 'POST' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Fetch wrapper that transparently handles access-token expiry.
 *
 * On a 401 response the function attempts one token refresh via the
 * /api/token/refresh route handler, then retries the original request.
 * If the refresh also fails it dispatches an 'auth:session-expired' event
 * so AuthProvider can redirect the user to login.
 *
 * Because tokens are stored in HTTP-only cookies and forwarded by Next.js
 * route handlers, no Authorization header is managed here — just call the
 * Next.js /api/* routes as normal.
 */
export async function fetchWithAuth(url, options = {}) {
  let response = await fetch(url, options);

  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await fetch(url, options);
    } else {
      dispatchSessionExpired();
    }
  }

  return response;
}
