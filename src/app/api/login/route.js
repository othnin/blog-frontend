import { setRefreshToken, setToken } from '@/lib/auth'
import { NextResponse } from 'next/server'

const DJANGO_BASE_URL = process.env.DJANGO_BASE_URL || 'http://127.0.0.1:8001'
const DJANGO_API_LOGIN_URL = `${DJANGO_BASE_URL}/api/token/pair`

export async function POST(request) {
    const requestData = await request.json()
    const jsonData = JSON.stringify(requestData)
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: jsonData
    }
    const response = await fetch(DJANGO_API_LOGIN_URL, requestOptions)
    const responseData = await response.json()
    if (response.ok) {
        console.log("logged in")
        const {username, access, refresh} = responseData
        setToken(access)
        setRefreshToken(refresh)
        return NextResponse.json({"loggedIn": true, "username": username}, {status: 200})
    }
    return NextResponse.json({"loggedIn": false, ...responseData}, {status: response.status})
}   