"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/authProvider"

const LOGIN_URL = "/api/login"


export default function Page() {
  const auth = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  async function handleSubmit (event) {
        event.preventDefault()
        setError('')
        setLoading(true)
        
        const formData = new FormData(event.target)
        const objectFromForm = Object.fromEntries(formData)
        const jsonData = JSON.stringify(objectFromForm)
        const requestOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: jsonData
        }
        
        try {
          const response = await fetch(LOGIN_URL, requestOptions)
          const data = await response.json()
          
          if (response.ok) {
              console.log("logged in")
              // Store tokens
              localStorage.setItem('access_token', data.access)
              localStorage.setItem('refresh_token', data.refresh)
              auth.login(objectFromForm.username)
          } else {
            let errorMessage = 'Login failed'
            
            // Handle Pydantic validation errors (array of error objects)
            if (Array.isArray(data) && data.length > 0 && data[0].msg) {
              errorMessage = data.map(err => {
                const field = err.loc?.[1] || 'field'
                return `${field}: ${err.msg}`
              }).join('; ')
            }
            // Handle standard error response with detail
            else if (data.detail) {
              errorMessage = data.detail
            }
            // Handle message field
            else if (data.message) {
              errorMessage = data.message
            }
            
            setError(errorMessage)
            setLoading(false)
          }
        } catch (err) {
          console.error('Login error:', err)
          setError('An error occurred. Please try again.')
          setLoading(false)
        }
    }
    
  return (
    <div className="w-full lg:grid lg:min-h-[85vh]  lg:grid-cols-2 xl:min-h-[90vh]">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Login</h1>
            <p className="text-balance text-muted-foreground">
              Enter your email below to login to your account
            </p>
          </div>
          
          {error && (
            <div className="p-4 bg-red-100 text-red-700 rounded text-sm">
              {error}
            </div>
          )}
          
          <div className="grid gap-4">
            <form onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="username"
                name="username"
                placeholder="Your username"
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="hidden"
                >
                  Forgot your password?
                </Link>
              </div>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
            </form>
          </div>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        <Image
          src="/placeholder.svg"
          alt="Image"
          width="1920"
          height="1080"
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}
