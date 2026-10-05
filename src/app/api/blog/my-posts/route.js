import { getToken } from '@/lib/auth';
import { getDjangoBaseUrl } from '@/lib/backendUrl.mjs';

const DJANGO_BASE_URL = getDjangoBaseUrl();
export async function GET() {
  const token = await getToken();

  if (!token) {
    return new Response(JSON.stringify({ detail: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const response = await fetch(`${DJANGO_BASE_URL}/api/blog/my-posts/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.text();
    return new Response(data, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[blog/my-posts] proxy error:', err.message);
    return new Response(
      JSON.stringify({ detail: `Proxy error: ${err.message}` }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
