'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    new_password: '',
    new_password_confirm: '',
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
      const response = await fetch('/api/auth/password-reset-confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          token,
          new_password: formData.new_password,
          new_password_confirm: formData.new_password_confirm,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = 'Password reset failed';
        
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
        // Handle field-specific errors
        else if (data.new_password?.[0]) {
          errorMessage = `Password: ${data.new_password[0]}`;
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

  if (success) {
    return (
      <div className="max-w-md mx-auto p-6 bg-card rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-foreground">Password Reset</h1>
        <div className="p-4 bg-green-100 text-green-700 rounded mb-4">
          Your password has been reset successfully!
        </div>
        <p className="text-gray-600 mb-4">
          Redirecting to login page...
        </p>
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            New Password
          </label>
          <input
            type="password"
            name="new_password"
            value={formData.new_password}
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
            name="new_password_confirm"
            value={formData.new_password_confirm}
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
          {loading ? 'Resetting...' : 'Reset Password'}
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
