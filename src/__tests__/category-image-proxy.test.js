/**
 * Regression tests for the category image proxy.
 *
 * Category image URLs end in a slash. The generic /api/:path* rewrite drops it,
 * which makes Django's APPEND_SLASH 301 loop back to the same URL. This route
 * handler proxies to Django with the slash intact and forwards the redirect.
 */
import { getDjangoBaseUrl } from '@/lib/backendUrl.mjs';
import * as categoryImageRoute from '@/app/api/blog/categories/[slug]/image/route';

jest.mock('@/lib/backendUrl.mjs', () => ({
  getDjangoBaseUrl: jest.fn(() => 'http://localhost:8001'),
}));

const mockGetDjangoBaseUrl = getDjangoBaseUrl;

// jsdom does not provide fetch's Request/Response primitives.
function headersFrom(init = {}) {
  const values = new Map(
    Object.entries(init).map(([key, value]) => [key.toLowerCase(), String(value)])
  );
  return { get: (name) => values.get(String(name).toLowerCase()) ?? null };
}

class TestResponse {
  constructor(body, init = {}) {
    this._body = body;
    this.status = init.status || 200;
    this.headers = headersFrom(init.headers);
  }

  async text() {
    return this._body == null ? '' : String(this._body);
  }

  async json() {
    return JSON.parse(await this.text());
  }
}

if (typeof global.Response === 'undefined') {
  global.Response = TestResponse;
}

function mockFetchResponse({ status = 200, body = '', headers = {} } = {}) {
  return {
    status,
    headers: headersFrom(headers),
    text: async () => body,
    json: async () => JSON.parse(body),
  };
}

function callRoute(slug) {
  return categoryImageRoute.GET({}, { params: Promise.resolve({ slug }) });
}

describe('GET /api/blog/categories/[slug]/image/', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    mockGetDjangoBaseUrl.mockReturnValue('http://localhost:8001');
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it('calls Django with the trailing slash and manual redirects', async () => {
    global.fetch.mockResolvedValueOnce(
      mockFetchResponse({
        status: 302,
        headers: {
          Location: 'https://t3.storageapi.dev/bucket/category_images/x.png?token=1',
          'Cache-Control': 'no-store',
        },
      })
    );

    const response = await callRoute('sci-fi');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8001/api/blog/categories/sci-fi/image/',
      { redirect: 'manual' }
    );
    expect(response.status).toBe(302);
  });

  it('forwards the Location header and keeps the redirect uncached', async () => {
    const location = 'https://t3.storageapi.dev/bucket/category_images/x.png?token=1';
    global.fetch.mockResolvedValueOnce(
      mockFetchResponse({
        status: 302,
        headers: { Location: location, 'Cache-Control': 'no-store' },
      })
    );

    const response = await callRoute('sci-fi');

    expect(response.headers.get('location')).toBe(location);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('passes through 404s when a category has no image', async () => {
    global.fetch.mockResolvedValueOnce(
      mockFetchResponse({
        status: 404,
        body: JSON.stringify({ detail: 'Category has no image' }),
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const response = await callRoute('sci-fi');

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ detail: 'Category has no image' });
  });

  it('url-encodes the slug', async () => {
    global.fetch.mockResolvedValueOnce(
      mockFetchResponse({
        status: 302,
        headers: { Location: 'https://example.com/x.png' },
      })
    );

    await callRoute('sci fi/one');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8001/api/blog/categories/sci%20fi%2Fone/image/',
      { redirect: 'manual' }
    );
  });

  it('returns 502 when Django is unreachable', async () => {
    const err = new Error('ECONNREFUSED');
    err.cause = { code: 'ECONNREFUSED' };
    global.fetch.mockRejectedValueOnce(err);

    const response = await callRoute('sci-fi');

    expect(response.status).toBe(502);
  });
});
