import '@testing-library/jest-dom';
import { fetchWithAuth, refreshAccessToken } from '@/lib/tokenUtils';

// Mock the API_ENDPOINTS config
jest.mock('@/config/api', () => ({
  API_ENDPOINTS: {
    auth: {
      refreshToken: '/api/token/refresh',
    },
  },
}));

// Mock global fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] ?? null),
    setItem: jest.fn((key, value) => { store[key] = String(value); }),
    removeItem: jest.fn((key) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
    _store: () => store,
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

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
  fetch.mockReset(); // also clears the mockResolvedValueOnce queue
  localStorageMock.clear();
  dispatchEventSpy.mockClear();
});

// ---------------------------------------------------------------------------
// refreshAccessToken
// ---------------------------------------------------------------------------

describe('refreshAccessToken', () => {
  it('returns false immediately when no refresh token is stored', async () => {
    const result = await refreshAccessToken();
    expect(result).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('stores new access token and returns true on success', async () => {
    localStorageMock.setItem('refresh_token', 'old-refresh');
    fetch.mockResolvedValueOnce(mockResponse(200, { access: 'new-access', refresh: 'new-refresh' }));

    const result = await refreshAccessToken();

    expect(result).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', 'new-access');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('refresh_token', 'new-refresh');
  });

  it('stores only access token when response omits refresh token', async () => {
    localStorageMock.setItem('refresh_token', 'old-refresh');
    localStorageMock.setItem.mockClear(); // don't count the setup call
    fetch.mockResolvedValueOnce(mockResponse(200, { access: 'new-access' }));

    const result = await refreshAccessToken();

    expect(result).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', 'new-access');
    // refresh_token should not be updated by the refresh response
    const refreshCalls = localStorageMock.setItem.mock.calls.filter(([k]) => k === 'refresh_token');
    expect(refreshCalls).toHaveLength(0);
  });

  it('clears tokens and returns false on non-200 response', async () => {
    localStorageMock.setItem('refresh_token', 'old-refresh');
    localStorageMock.setItem('access_token', 'old-access');
    fetch.mockResolvedValueOnce(mockResponse(401, { detail: 'Token expired' }));

    const result = await refreshAccessToken();

    expect(result).toBe(false);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
  });

  it('returns false when fetch throws a network error', async () => {
    localStorageMock.setItem('refresh_token', 'old-refresh');
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await refreshAccessToken();

    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// fetchWithAuth
// ---------------------------------------------------------------------------

describe('fetchWithAuth', () => {
  it('returns the response as-is for a 200 without touching auth', async () => {
    localStorageMock.setItem('access_token', 'valid-token');
    const ok = mockResponse(200, { data: 'hello' });
    fetch.mockResolvedValueOnce(ok);

    const result = await fetchWithAuth('/api/data');

    expect(result.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('/api/data', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer valid-token' }),
    }));
  });

  it('makes the request without Authorization header when no token is stored', async () => {
    const ok = mockResponse(200);
    fetch.mockResolvedValueOnce(ok);

    await fetchWithAuth('/api/public');

    expect(fetch).toHaveBeenCalledWith('/api/public', expect.objectContaining({
      headers: expect.not.objectContaining({ Authorization: expect.anything() }),
    }));
  });

  it('dispatches auth:session-expired and returns 401 immediately when there is no token', async () => {
    fetch.mockResolvedValueOnce(mockResponse(401));

    const result = await fetchWithAuth('/api/protected');

    expect(result.status).toBe(401);
    expect(dispatchEventSpy).toHaveBeenCalledTimes(1);
    const event = dispatchEventSpy.mock.calls[0][0];
    expect(event.type).toBe('auth:session-expired');
    // Should not attempt token refresh
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('retries with new token and returns success after refresh succeeds', async () => {
    localStorageMock.setItem('access_token', 'expired-token');
    localStorageMock.setItem('refresh_token', 'valid-refresh'); // needed by refreshAccessToken

    // First call: 401
    fetch.mockResolvedValueOnce(mockResponse(401));
    // Refresh call: success — refreshAccessToken will store 'new-token' in localStorage
    fetch.mockResolvedValueOnce(mockResponse(200, { access: 'new-token' }));
    // Retry call: success
    fetch.mockResolvedValueOnce(mockResponse(200, { data: 'secret' }));

    const result = await fetchWithAuth('/api/protected');

    expect(result.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(3);
    // Third call should use the new token set by refreshAccessToken
    expect(fetch).toHaveBeenNthCalledWith(3, '/api/protected', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer new-token' }),
    }));
    expect(dispatchEventSpy).not.toHaveBeenCalled();
  });

  it('dispatches auth:session-expired when token is present but refresh fails', async () => {
    localStorageMock.setItem('access_token', 'expired-token');
    localStorageMock.setItem('refresh_token', 'expired-refresh');

    // First call: 401
    fetch.mockResolvedValueOnce(mockResponse(401));
    // Refresh call: also fails
    fetch.mockResolvedValueOnce(mockResponse(401, { detail: 'Refresh token expired' }));

    const result = await fetchWithAuth('/api/protected');

    expect(result.status).toBe(401);
    expect(dispatchEventSpy).toHaveBeenCalledTimes(1);
    const event = dispatchEventSpy.mock.calls[0][0];
    expect(event.type).toBe('auth:session-expired');
    // Should not retry the original request after failed refresh
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('merges caller-provided headers with Authorization', async () => {
    localStorageMock.setItem('access_token', 'my-token');
    fetch.mockResolvedValueOnce(mockResponse(200));

    await fetchWithAuth('/api/data', {
      headers: { 'X-Custom': 'value', 'Content-Type': 'application/json' },
    });

    expect(fetch).toHaveBeenCalledWith('/api/data', expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: 'Bearer my-token',
        'X-Custom': 'value',
        'Content-Type': 'application/json',
      }),
    }));
  });

  it('passes through method and body options', async () => {
    localStorageMock.setItem('access_token', 'token');
    fetch.mockResolvedValueOnce(mockResponse(201));

    await fetchWithAuth('/api/posts', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test' }),
    });

    expect(fetch).toHaveBeenCalledWith('/api/posts', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ title: 'Test' }),
    }));
  });
});
