'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/password-reset-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = 'Request failed';
        
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
      // Even if email doesn't exist, we show success (security best practice)
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto p-6 bg-card rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-foreground">Check Your Email</h1>
        <div className="p-4 bg-blue-100 text-blue-700 rounded mb-4">
          If an account exists with that email, we've sent password reset instructions.
        </div>
        <p className="text-gray-600 mb-4">
          Check your email for a link to reset your password. The link expires in 24 hours.
        </p>
        <Link
          href="/login"
          className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-card rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-foreground">Reset Password</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <p className="mb-4 text-gray-600">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="your@example.com"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        Remember your password?{' '}
        <Link href="/login" className="text-blue-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
