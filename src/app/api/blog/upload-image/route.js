import { getToken } from '@/lib/auth';

const DJANGO_BASE_URL = process.env.DJANGO_BASE_URL || 'http://127.0.0.1:8001';

export async function POST(request) {
  const token = getToken();

  if (!token) {
    return new Response(JSON.stringify({ detail: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const contentType = request.headers.get('content-type');
    const body = await request.arrayBuffer();

    const response = await fetch(`${DJANGO_BASE_URL}/api/blog/upload-image/`, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        Authorization: `Bearer ${token}`,
      },
      body,
    });

    const data = await response.text();
    return new Response(data, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ detail: `Proxy error: ${err.message}` }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
