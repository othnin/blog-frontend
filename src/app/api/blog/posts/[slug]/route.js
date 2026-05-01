import { getToken } from '@/lib/auth';

const DJANGO_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_BASE_URL || process.env.DJANGO_BASE_URL || 'http://127.0.0.1:8001';

export async function GET(request, { params }) {
  const { slug } = await params;

  console.log(`[blog/posts/${slug}] Fetching → ${DJANGO_BASE_URL}/api/blog/posts/${slug}/`);

  try {
    const response = await fetch(`${DJANGO_BASE_URL}/api/blog/posts/${slug}/`, {
      headers: { 'Content-Type': 'application/json' },
      redirect: 'manual',
    });

    console.log(`[blog/posts/${slug}] Django responded: ${response.status}`);

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      console.error(`[blog/posts/${slug}] Django returned redirect ${response.status} → ${location}`);
      return new Response(JSON.stringify({ detail: `Backend redirect: ${response.status} ${location}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.text();
    return new Response(data, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(`[blog/posts/${slug}] proxy error:`, err.message);
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

export async function PUT(request, { params }) {
  const { slug } = await params;
  const token = await getToken();

  if (!token) {
    return new Response(JSON.stringify({ detail: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.text();
    const response = await fetch(`${DJANGO_BASE_URL}/api/blog/posts/${slug}/`, {
      method: 'PUT',
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
    return new Response(JSON.stringify({ detail: `Proxy error: ${err.message}` }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function DELETE(request, { params }) {
  const { slug } = await params;
  const token = await getToken();

  if (!token) {
    return new Response(JSON.stringify({ detail: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const response = await fetch(`${DJANGO_BASE_URL}/api/blog/posts/${slug}/`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.text();
    return new Response(data || '{}', {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ detail: `Proxy error: ${err.message}` }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
