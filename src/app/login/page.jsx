'use client';

import { useState, Suspense } from 'react';
import Script from 'next/script';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/authProvider';
import { API_ENDPOINTS } from '@/config/api';

function LoginContent() {
  const auth = useAuth();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get('registered') === 'true';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showUnverified, setShowUnverified] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        auth.login(data.username);
      } else {
        let errorMessage = 'Login failed';

        if (Array.isArray(data) && data.length > 0 && data[0].msg) {
          errorMessage = data
            .map((err) => {
              const field = err.loc?.[1] || 'field';
              return `${field}: ${err.msg}`;
            })
            .join('; ');
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        }

        if (errorMessage.includes('Email not verified')) {
          setShowUnverified(true);
          // Pre-fill email if the username field looks like an email
          if (formData.username.includes('@')) {
            setResendEmail(formData.username);
          }
        }
        setError(errorMessage);
        setLoading(false);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (response) => {
    setError('');
    try {
      const res = await fetch('/api/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (data.loggedIn) {
        auth.login(data.username);
      } else {
        setError(data.message || 'Google login failed. Please try again.');
      }
    } catch {
      setError('Google login failed. Please try again.');
    }
  };

  async function handleResend(e) {
    e.preventDefault();
    if (!resendEmail.trim()) return;
    setResendLoading(true);
    setResendMessage('');
    try {
      const res = await fetch(API_ENDPOINTS.auth.resendVerification, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail.trim() }),
      });
      const data = await res.json();
      setResendMessage(data.message || 'Verification email sent.');
    } catch {
      setResendMessage('Something went wrong. Please try again.');
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-card rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-foreground">Login</h1>

      {justRegistered && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">
          Account created! You can now log in.
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {showUnverified && !resendMessage && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded text-sm">
          <p className="font-medium text-amber-800 mb-2">Didn&apos;t receive a verification email?</p>
          <form onSubmit={handleResend} className="flex gap-2">
            <input
              type="email"
              required
              placeholder="Your email address"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              className="flex-1 px-3 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              type="submit"
              disabled={resendLoading}
              className="px-3 py-1.5 bg-amber-600 text-white rounded text-sm hover:bg-amber-700 disabled:opacity-50 whitespace-nowrap"
            >
              {resendLoading ? 'Sending…' : 'Resend'}
            </button>
          </form>
        </div>
      )}

      {resendMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded text-sm">
          {resendMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Username or Email</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="your username or email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {/* Google Sign-In button */}
      <div className="mt-4">
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-gray-300 dark:border-gray-600 w-full" />
          <span className="px-3 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900">or</span>
          <div className="border-t border-gray-300 dark:border-gray-600 w-full" />
        </div>
        <div id="google-signin-btn" className="flex justify-center" />
      </div>

      <p className="mt-4 text-center text-sm">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-blue-600 hover:underline">
          Sign up
        </Link>
      </p>

      <p className="mt-2 text-center text-sm">
        <Link href="/forgot-password" className="text-blue-600 hover:underline">
          Forgot password?
        </Link>
      </p>

      <Script
        src="https://accounts.google.com/gsi/client"
        onLoad={() => {
          if (window.google && process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
            window.google.accounts.id.initialize({
              client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
              callback: handleGoogleCredential,
            });
            window.google.accounts.id.renderButton(
              document.getElementById('google-signin-btn'),
              { theme: 'outline', size: 'large', width: '100%' }
            );
          }
        }}
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>}>
      <LoginContent />
    </Suspense>
  );
}
