import { getToken } from '@/lib/auth';

const DJANGO_BASE_URL = process.env.DJANGO_BASE_URL || 'http://127.0.0.1:8001';

export async function GET() {
  const token = getToken();
  if (!token) {
    return new Response(JSON.stringify({ detail: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  try {
    const response = await fetch(`${DJANGO_BASE_URL}/api/auth/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.text();
    return new Response(data, { status: response.status, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ detail: 'Failed to reach backend' }), {
      status: 502, headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PATCH(request) {
  const token = getToken();
  if (!token) {
    return new Response(JSON.stringify({ detail: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  try {
    const body = await request.text();
    const response = await fetch(`${DJANGO_BASE_URL}/api/auth/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body,
    });
    const data = await response.text();
    return new Response(data, { status: response.status, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ detail: 'Failed to reach backend' }), {
      status: 502, headers: { 'Content-Type': 'application/json' },
    });
  }
}
