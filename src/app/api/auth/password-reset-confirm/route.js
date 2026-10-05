import { getDjangoBaseUrl } from '@/lib/backendUrl.mjs';
const DJANGO_BASE_URL = getDjangoBaseUrl();
export async function POST(request) {
  try {
    const body = await request.json();

    const url = `${DJANGO_BASE_URL}/api/auth/password-reset-confirm`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Password Reset Confirm API error:', error);
    return new Response(
      JSON.stringify({ detail: 'An error occurred' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
