const isDev = process.env.NODE_ENV === 'development';

/**
 * Log a structured error. In dev this goes to console.error.
 * Extend this to POST to a logging endpoint or integrate Sentry as needed.
 *
 * @param {string} context  - Where the error occurred, e.g. 'AdminUsersPage.fetchUsers'
 * @param {Error|unknown} error
 * @param {Record<string, unknown>} [extra] - Any additional context (userId, url, etc.)
 */
export function logError(context, error, extra = {}) {
  const entry = {
    level: 'error',
    context,
    message: error?.message || String(error),
    timestamp: new Date().toISOString(),
    ...extra,
  };
  console.error('[APP ERROR]', entry);
}

/**
 * Log a structured warning (dev-only by default).
 */
export function logWarn(context, message, extra = {}) {
  if (isDev) {
    console.warn('[APP WARN]', { context, message, timestamp: new Date().toISOString(), ...extra });
  }
}
