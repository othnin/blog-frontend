const BACKEND_URL = process.env.NEXT_PUBLIC_DJANGO_BASE_URL || process.env.DJANGO_BASE_URL || 'http://127.0.0.1:8001';

export async function POST(request) {
  const targetUrl = `${BACKEND_URL}/api/token/pair`;
  console.log('[token/pair] → forwarding to:', targetUrl);

  let body;
  try {
    body = await request.text();
  } catch (err) {
    console.error('[token/pair] failed to read request body:', err.message);
    return new Response(JSON.stringify({ detail: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const backendResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    const responseText = await backendResponse.text();

    return new Response(responseText, {
      status: backendResponse.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[token/pair] fetch failed:', err.message);
    console.error('[token/pair] cause:', err.cause?.message ?? 'none');

    const isConnectionRefused =
      err.cause?.code === 'ECONNREFUSED' || err.message.includes('ECONNREFUSED');

    return new Response(
      JSON.stringify({
        detail: isConnectionRefused
          ? `Cannot reach backend at ${targetUrl} — is Django running on port 8001?`
          : `Proxy error: ${err.message}`,
      }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
