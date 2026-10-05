import { getDjangoBaseUrl } from '@/lib/backendUrl.mjs';
const DJANGO_BASE_URL = getDjangoBaseUrl();
export async function POST(request) {
  try {
    const body = await request.json();

    const response = await fetch(`${DJANGO_BASE_URL}/api/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.ok ? 200 : response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ detail: 'An error occurred' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
