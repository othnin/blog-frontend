import { getToken } from '@/lib/auth';

const DJANGO_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_BASE_URL || process.env.DJANGO_BASE_URL || 'http://127.0.0.1:8001';

async function proxy(request, { params }) {
  const { path } = await params;
  const { searchParams } = new URL(request.url);

  const url = new URL(`${DJANGO_BASE_URL}/api/recipes/${path.join('/')}/`);
  searchParams.forEach((value, key) => url.searchParams.set(key, value));

  const token = await getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Copy multipart/form-data content-type through unchanged (for file uploads)
  const reqContentType = request.headers.get('content-type');
  if (reqContentType && reqContentType.includes('multipart/form-data')) {
    delete headers['Content-Type'];
  }

  const init = {
    method: request.method,
    headers,
    redirect: 'manual',
  };

  if (!['GET', 'HEAD'].includes(request.method)) {
    if (reqContentType?.includes('multipart/form-data')) {
      init.body = await request.blob();
    } else {
      init.body = await request.text();
    }
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
export const PUT = proxy;
export const DELETE = proxy;
export const PATCH = proxy;
