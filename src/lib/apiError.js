/**
 * Normalize an API error payload into a string that is safe to render.
 *
 * Django Ninja returns 422 validation errors as
 * `{ detail: [{ type, loc, msg }, ...] }`. Rendering that array (or any of its
 * objects) directly as a React child throws "Objects are not valid as a React
 * child" (React error #31), so callers must always reduce it to text first.
 */
const LOCATION_PREFIXES = new Set(['body', 'query', 'path', 'header']);

export function getApiErrorMessage(payload, fallback = 'Something went wrong.') {
  const detail = payload?.detail ?? payload;

  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (!item || typeof item !== 'object' || !item.msg) return null;
        const parts = Array.isArray(item.loc) ? item.loc : [];
        const field = [...parts]
          .reverse()
          .find((part) => typeof part === 'string' && !LOCATION_PREFIXES.has(part));
        return field ? `${field}: ${item.msg}` : item.msg;
      })
      .filter(Boolean);

    if (messages.length) {
      return messages.join('; ');
    }
  }

  if (typeof payload?.message === 'string' && payload.message.trim()) {
    return payload.message;
  }

  return fallback;
}
