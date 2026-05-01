import { getRefreshToken, deleteTokens } from "@/lib/auth";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_DJANGO_BASE_URL || process.env.DJANGO_BASE_URL || 'http://127.0.0.1:8001';

export async function POST() {
    const refreshToken = await getRefreshToken();

    if (refreshToken) {
        try {
            await fetch(`${BACKEND_URL}/api/token/blacklist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh: refreshToken }),
            });
        } catch {
            // Continue with logout even if blacklist call fails
        }
    }

    await deleteTokens();
    return NextResponse.json({}, { status: 200 });
}
