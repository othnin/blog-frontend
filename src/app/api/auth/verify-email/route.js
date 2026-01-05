const DJANGO_BASE_URL = process.env.DJANGO_BASE_URL || 'http://127.0.0.1:8001';

export async function POST(request) {
  try {
    const body = await request.json();

    const url = `${DJANGO_BASE_URL}/api/auth/verify-email`;
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
    console.error('Verify Email API error:', error);
    return new Response(
      JSON.stringify({ detail: 'An error occurred' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
