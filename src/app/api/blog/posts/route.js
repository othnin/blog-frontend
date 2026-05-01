import { getToken } from '@/lib/auth';

const DJANGO_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_BASE_URL || process.env.DJANGO_BASE_URL || 'http://127.0.0.1:8001';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit');
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const tags = searchParams.get('tags');

  const url = new URL(`${DJANGO_BASE_URL}/api/blog/posts/`);
  if (limit) url.searchParams.set('limit', limit);
  if (category) url.searchParams.set('category', category);
  if (search) url.searchParams.set('search', search);
  if (tags) url.searchParams.set('tags', tags);

  console.log(`[blog/posts] Fetching → ${url.toString()}`);

  try {
    const response = await fetch(url.toString(), {
      headers: { 'Content-Type': 'application/json' },
      redirect: 'manual',
    });

    console.log(`[blog/posts] Django responded: ${response.status}`);

    const data = await response.text();
    return new Response(data, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[blog/posts] proxy error:', err.message);
    const isConnRefused =
      err.cause?.code === 'ECONNREFUSED' || err.message.includes('ECONNREFUSED');
    return new Response(
      JSON.stringify({
        detail: isConnRefused
          ? `Cannot reach backend at ${DJANGO_BASE_URL} — is Django running on port 8001?`
          : `Proxy error: ${err.message}`,
      }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

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
    const response = await fetch(`${DJANGO_BASE_URL}/api/blog/posts/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
