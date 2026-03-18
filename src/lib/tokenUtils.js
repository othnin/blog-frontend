import { API_ENDPOINTS } from '@/config/api';

export async function refreshAccessToken() {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      console.warn('No refresh token available');
      return false;
    }

    const response = await fetch(API_ENDPOINTS.auth.refreshToken, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      console.error('Token refresh failed:', response.status);
      // Clear invalid tokens
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      return false;
    }

    const data = await response.json();
    if (data.access) {
      localStorage.setItem('access_token', data.access);
      if (data.refresh) {
        localStorage.setItem('refresh_token', data.refresh);
      }
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
}

export async function fetchWithAuth(url, options = {}) {
  let token = localStorage.getItem('access_token');

  const headers = {
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response = await fetch(url, { ...options, headers });

  // If 401, try to refresh token and retry once
  if (response.status === 401 && token) {
    console.log('Token expired, attempting refresh...');
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      token = localStorage.getItem('access_token');
      headers.Authorization = `Bearer ${token}`;
      response = await fetch(url, { ...options, headers });
    }
  }

  return response;
}
