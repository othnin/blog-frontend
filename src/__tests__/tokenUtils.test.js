import '@testing-library/jest-dom';
import { fetchWithAuth, refreshAccessToken } from '@/lib/tokenUtils';

// Mock global fetch
global.fetch = jest.fn();

// Mock window.dispatchEvent
const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

function mockResponse(status, body = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  fetch.mockReset();
  dispatchEventSpy.mockClear();
});

// ---------------------------------------------------------------------------
// refreshAccessToken
// ---------------------------------------------------------------------------

describe('refreshAccessToken', () => {
  it('calls POST /api/token/refresh and returns true on success', async () => {
    fetch.mockResolvedValueOnce(mockResponse(200));

    const result = await refreshAccessToken();

    expect(result).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('/api/token/refresh', { method: 'POST' });
  });

  it('returns false on a non-2xx response', async () => {
    fetch.mockResolvedValueOnce(mockResponse(401));

    const result = await refreshAccessToken();

    expect(result).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('returns false when fetch throws a network error', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await refreshAccessToken();

    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// fetchWithAuth
// ---------------------------------------------------------------------------

describe('fetchWithAuth', () => {
  it('returns the response directly on success without touching auth', async () => {
    fetch.mockResolvedValueOnce(mockResponse(200, { data: 'hello' }));

    const result = await fetchWithAuth('/api/data');

    expect(result.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('/api/data', {});
  });

  it('retries original request after successful token refresh', async () => {
    fetch
      .mockResolvedValueOnce(mockResponse(401))              // original → 401
      .mockResolvedValueOnce(mockResponse(200))              // refresh → ok
      .mockResolvedValueOnce(mockResponse(200, { data: 'secret' })); // retry → ok

    const result = await fetchWithAuth('/api/protected');

    expect(result.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(fetch).toHaveBeenNthCalledWith(2, '/api/token/refresh', { method: 'POST' });
    expect(fetch).toHaveBeenNthCalledWith(3, '/api/protected', {});
    expect(dispatchEventSpy).not.toHaveBeenCalled();
  });

  it('dispatches auth:session-expired and does not retry when refresh fails', async () => {
    fetch
      .mockResolvedValueOnce(mockResponse(401)) // original → 401
      .mockResolvedValueOnce(mockResponse(401)); // refresh → also 401

    const result = await fetchWithAuth('/api/protected');

    expect(result.status).toBe(401);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(dispatchEventSpy).toHaveBeenCalledTimes(1);
    const event = dispatchEventSpy.mock.calls[0][0];
    expect(event.type).toBe('auth:session-expired');
  });

  it('dispatches auth:session-expired when refresh throws a network error', async () => {
    fetch
      .mockResolvedValueOnce(mockResponse(401))           // original → 401
      .mockRejectedValueOnce(new Error('Network error')); // refresh → throws

    await fetchWithAuth('/api/protected');

    expect(dispatchEventSpy).toHaveBeenCalledTimes(1);
    expect(dispatchEventSpy.mock.calls[0][0].type).toBe('auth:session-expired');
  });

  it('passes all options through to fetch', async () => {
    fetch.mockResolvedValueOnce(mockResponse(201));

    await fetchWithAuth('/api/posts', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test' }),
      headers: { 'Content-Type': 'application/json' },
    });

    expect(fetch).toHaveBeenCalledWith('/api/posts', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test' }),
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('does not dispatch session-expired on non-401 error responses', async () => {
    fetch.mockResolvedValueOnce(mockResponse(500));

    const result = await fetchWithAuth('/api/data');

    expect(result.status).toBe(500);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(dispatchEventSpy).not.toHaveBeenCalled();
  });

  it('returns the retried response even if it is also a non-200', async () => {
    fetch
      .mockResolvedValueOnce(mockResponse(401)) // original
      .mockResolvedValueOnce(mockResponse(200)) // refresh ok
      .mockResolvedValueOnce(mockResponse(403)); // retry returns 403

    const result = await fetchWithAuth('/api/forbidden');

    expect(result.status).toBe(403);
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(dispatchEventSpy).not.toHaveBeenCalled();
  });
});
