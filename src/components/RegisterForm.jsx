'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password_confirm: '',
    username: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = 'Registration failed';
        
        // Django Ninja 422: { detail: [{type, loc, msg, ctx}, ...] }
        if (Array.isArray(data?.detail) && data.detail[0]?.msg) {
          errorMessage = data.detail.map(err => {
            const field = err.loc?.[err.loc.length - 1] || 'field';
            return `${field}: ${err.msg}`;
          }).join('; ');
        }
        // Top-level array of validation errors
        else if (Array.isArray(data) && data[0]?.msg) {
          errorMessage = data.map(err => {
            const field = err.loc?.[1] || 'field';
            return `${field}: ${err.msg}`;
          }).join('; ');
        }
        else if (typeof data.detail === 'string') {
          errorMessage = data.detail;
        }
        else if (data.message) {
          errorMessage = data.message;
        }
        else if (data.password?.[0]) {
          errorMessage = `Password: ${data.password[0]}`;
        }
        else if (data.email?.[0]) {
          errorMessage = `Email: ${data.email[0]}`;
        }
        
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // In debug/dev mode email sending is disabled — go straight to login.
      // Set NEXT_PUBLIC_SKIP_EMAIL_VERIFICATION=true in .env.local for development.
      if (process.env.NEXT_PUBLIC_SKIP_EMAIL_VERIFICATION === 'true') {
        router.push('/login?registered=true');
      } else {
        router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-card rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-foreground">Create Account</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Choose your username"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="you@example.com"
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
            placeholder="At least 8 characters"
          />
          <p className="text-xs text-gray-500 mt-1">
            Must contain: uppercase, lowercase, and number
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Confirm Password
          </label>
          <input
            type="password"
            name="password_confirm"
            value={formData.password_confirm}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Confirm password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
