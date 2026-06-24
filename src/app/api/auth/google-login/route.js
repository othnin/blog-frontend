import { NextResponse } from 'next/server'
import { setToken, setRefreshToken } from '@/lib/auth'

const DJANGO_URL =
  process.env.NEXT_PUBLIC_DJANGO_BASE_URL ||
  process.env.DJANGO_BASE_URL ||
  'http://127.0.0.1:8001'

export async function POST(request) {
  try {
    const { credential } = await request.json()

    const djangoRes = await fetch(`${DJANGO_URL}/api/auth/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    })

    const data = await djangoRes.json()

    if (data.status !== 'success') {
      return NextResponse.json(
        { loggedIn: false, message: data.message || 'Google login failed' },
        { status: 400 }
      )
    }

    await setToken(data.access)
    await setRefreshToken(data.refresh)

    return NextResponse.json({ loggedIn: true, username: data.username })
  } catch (error) {
    return NextResponse.json(
      { loggedIn: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
