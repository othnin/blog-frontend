import { setRefreshToken, setToken } from '@/lib/auth'
import { NextResponse } from 'next/server'

const DJANGO_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_BASE_URL || process.env.DJANGO_BASE_URL || 'http://127.0.0.1:8001'
const DJANGO_API_LOGIN_URL = `${DJANGO_BASE_URL}/api/token/pair`

export async function POST(request) {
    const requestData = await request.json()
    console.log('[LOGIN] Request received at /api/login')
    console.log('[LOGIN] Django base URL:', DJANGO_API_LOGIN_URL)
    console.log('[LOGIN] Credentials being sent:', {
        username: requestData.username || 'MISSING',
        password: requestData.password ? '***hidden***' : 'MISSING'
    })

    const jsonData = JSON.stringify(requestData)
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: jsonData
    }

    let response, responseData
    try {
        response = await fetch(DJANGO_API_LOGIN_URL, requestOptions)
        responseData = await response.json()
    } catch (error) {
        console.error('[LOGIN] Fetch error:', error.message)
        return NextResponse.json({
            loggedIn: false,
            error: 'Failed to connect to backend',
            details: error.message
        }, {status: 502})
    }

    console.log('[LOGIN] Django response status:', response.status)
    if (response.status === 401) {
        console.log('[LOGIN] 401 Unauthorized. Response:', responseData)
    }

    if (response.ok) {
        console.log('[LOGIN] Success - logged in')
        const {username, access, refresh} = responseData
        await setToken(access)
        await setRefreshToken(refresh)
        return NextResponse.json({"loggedIn": true, "username": username}, {status: 200})
    }

    console.log('[LOGIN] Failed with status', response.status, '- response:', responseData)
    return NextResponse.json({"loggedIn": false, ...responseData}, {status: response.status})
}   