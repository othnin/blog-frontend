import { getToken } from '@/lib/auth';
import { getDjangoBaseUrl } from '@/lib/backendUrl.mjs';

async function proxy(request, { params }) {
  const token = await getToken();

  if (!token) {
    return new Response(JSON.stringify({ detail: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { path } = await params;
  const { searchParams } = new URL(request.url);

  const base = getDjangoBaseUrl();
  const url = new URL(`${base}/api/admin/${path.join('/')}/`);
  searchParams.forEach((value, key) => url.searchParams.set(key, value));

  const reqContentType = request.headers.get('content-type');
  const isMultipart = Boolean(reqContentType?.includes('multipart/form-data'));
  const headers = { Authorization: `Bearer ${token}` };

  // Pass multipart content-type through unchanged (for file uploads). Do not
  // rebuild it from a Blob: Blob.type is lowercased, which corrupts the
  // case-sensitive multipart boundary and makes Django reject the file.
  headers['Content-Type'] = reqContentType || 'application/json';

  const init = {
    method: request.method,
    headers,
    redirect: 'manual',
  };

  if (!['GET', 'HEAD'].includes(request.method)) {
    init.body = isMultipart ? await request.arrayBuffer() : await request.text();
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
          ? `Cannot reach backend at ${getDjangoBaseUrl()} — is Django running on port 8001?`
          : `Proxy error: ${err.message}`,
      }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
