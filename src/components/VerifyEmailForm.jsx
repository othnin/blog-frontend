'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const tokenFromUrl = searchParams.get('token') || '';
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState(tokenFromUrl);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Auto-verify if token is in URL
  useEffect(() => {
    if (tokenFromUrl && !token) {
      setToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  // Auto-submit if token was provided in URL
  useEffect(() => {
    if (tokenFromUrl && token && !success && !loading) {
      handleAutoVerify();
    }
  }, []);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const performVerification = async (verifyToken, verifyEmail) => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: verifyEmail,
          token: verifyToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = 'Verification failed';
        
        // Handle Pydantic validation errors (array of error objects)
        if (Array.isArray(data) && data.length > 0 && data[0].msg) {
          errorMessage = data.map(err => {
            const field = err.loc?.[1] || 'field';
            return `${field}: ${err.msg}`;
          }).join('; ');
        }
        // Handle standard error response with message
        else if (data.message) {
          errorMessage = data.message;
        }
        // Handle detail field
        else if (data.detail) {
          errorMessage = data.detail;
        }
        
        setError(errorMessage);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleAutoVerify = async () => {
    await performVerification(tokenFromUrl, email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await performVerification(token, email);
  };

  const handleResend = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setResendCountdown(60);
        setSuccess(false);
      } else {
        setError('Failed to resend verification email');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-card rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-foreground">Verify Email</h1>

      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">
          Email verified! Redirecting to login...
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <p className="mb-4 text-gray-600">
        We sent a verification link to <strong>{email || '(enter email below)'}</strong>. 
        {tokenFromUrl ? ' Your token was pre-filled from the email link.' : ' Enter the token from the email below.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-600"
            placeholder="Email address"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Verification Token
          </label>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter token from email"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !token}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify Email'}
        </button>
      </form>

      <div className="mt-4 pt-4 border-t">
        <p className="text-sm text-gray-600 mb-2">
          Didn't receive the email?
        </p>
        <button
          onClick={handleResend}
          disabled={resendCountdown > 0 || loading}
          className="text-blue-600 hover:underline disabled:text-gray-400"
        >
          {resendCountdown > 0
            ? `Resend in ${resendCountdown}s`
            : 'Resend verification email'}
        </button>
      </div>

      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="text-blue-600 hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
