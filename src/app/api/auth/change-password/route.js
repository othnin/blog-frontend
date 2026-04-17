import { getToken } from '@/lib/auth';

const DJANGO_BASE_URL = process.env.DJANGO_BASE_URL || 'http://127.0.0.1:8001';

export async function POST(request) {
  const token = await getToken();
  if (!token) {
    return new Response(JSON.stringify({ detail: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  try {
    const body = await request.text();
    const response = await fetch(`${DJANGO_BASE_URL}/api/auth/change-password`, {
      method: 'POST',
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
