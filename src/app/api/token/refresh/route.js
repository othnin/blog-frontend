import { getRefreshToken, setToken, setRefreshToken, deleteTokens } from '@/lib/auth';
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_DJANGO_BASE_URL || process.env.DJANGO_BASE_URL || 'http://127.0.0.1:8001';

export async function POST() {
    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
        return NextResponse.json({ detail: 'No refresh token' }, { status: 401 });
    }

    let backendResponse;
    try {
        backendResponse = await fetch(`${BACKEND_URL}/api/token/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken }),
        });
    } catch {
        return NextResponse.json({ detail: 'Backend unreachable' }, { status: 502 });
    }

    if (!backendResponse.ok) {
        // Refresh token is invalid or expired — clear cookies so the client is in a clean state
        await deleteTokens();
        return NextResponse.json({ detail: 'Token refresh failed' }, { status: 401 });
    }

    const data = await backendResponse.json();
    await setToken(data.access);
    if (data.refresh) {
        await setRefreshToken(data.refresh);
    }

    return NextResponse.json({ success: true }, { status: 200 });
}
