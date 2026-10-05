import { getToken } from '@/lib/auth';
import { getDjangoBaseUrl } from '@/lib/backendUrl.mjs';

const DJANGO_BASE_URL = getDjangoBaseUrl();
async function proxy(request) {
  const { searchParams } = new URL(request.url);

  const url = new URL(`${DJANGO_BASE_URL}/api/recipes/`);
  searchParams.forEach((value, key) => url.searchParams.set(key, value));

  const token = await getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const init = { method: request.method, headers, redirect: 'manual' };

  if (!['GET', 'HEAD'].includes(request.method)) {
    init.body = await request.text();
  }

  try {
    const response = await fetch(url.toString(), init);
    const body = await response.text();
    return new Response(body, {
      status: response.status,
      headers: { 'Content-Type': response.headers.get('content-type') || 'application/json' },
    });
  } catch (err) {
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

export const GET = proxy;
export const POST = proxy;
