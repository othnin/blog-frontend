'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { API_ENDPOINTS } from '@/config/api';

export default function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(!!token); // Start loading if token is in URL
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendEmail, setResendEmail] = useState(email);

  // Auto-verify if token is in URL
  useEffect(() => {
    if (token && email) {
      verifyEmail();
    }
  }, []);

  const verifyEmail = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = 'Verification failed';

        if (Array.isArray(data) && data.length > 0 && data[0].msg) {
          errorMessage = data.map((err) => err.msg).join('; ');
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.detail) {
          errorMessage = data.detail;
        }

        setError(errorMessage);
        setLoading(false);
        return;
      }

      // Success: redirect to login after a brief pause
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;

    setError('');
    setResendLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.auth.resendVerification, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setError(`Verification email sent to ${resendEmail}. Check your inbox for the link.`);
      } else {
        setError(data.message || 'Failed to resend verification email');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  // If no token in URL, show error message
  if (!token) {
    return (
      <div className="max-w-md mx-auto p-6 bg-card rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-foreground">Verify Email</h1>

        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded">
          <p className="text-amber-800 mb-3">
            Click the verification link in your email to verify your account.
          </p>
        </div>

        <form onSubmit={handleResend} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="your-email@example.com"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={resendLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {resendLoading ? 'Sending...' : 'Resend Verification Email'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          <Link href="/login" className="text-blue-600 hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    );
  }

  // If verifying (token in URL)
  if (loading) {
    return (
      <div className="max-w-md mx-auto p-6 bg-card rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-foreground">Verifying Email</h1>

        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Verifying your email...</p>
        </div>
      </div>
    );
  }

  // If verification failed
  return (
    <div className="max-w-md mx-auto p-6 bg-card rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-foreground">Verification Failed</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleResend} className="space-y-4 mt-6">
        <div>
          <label className="block text-sm font-medium mb-1">Email Address</label>
          <input
            type="email"
            required
            placeholder="your-email@example.com"
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={resendLoading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {resendLoading ? 'Sending...' : 'Resend Verification Email'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="text-blue-600 hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
