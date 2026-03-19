const DJANGO_BASE_URL = process.env.DJANGO_BASE_URL || 'http://127.0.0.1:8001';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit');

  const url = new URL(`${DJANGO_BASE_URL}/api/blog/posts/`);
  if (limit) url.searchParams.set('limit', limit);

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
