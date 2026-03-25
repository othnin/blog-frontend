const DJANGO_BASE_URL = process.env.DJANGO_BASE_URL || 'http://127.0.0.1:8001';

export async function POST(request, { params }) {
  const { slug } = await params;

  try {
    const response = await fetch(`${DJANGO_BASE_URL}/api/blog/posts/${slug}/like/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
