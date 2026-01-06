'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/authProvider';

const LOGOUT_URL = '/api/logout/';

export default function LogoutPage() {
  const auth = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogout = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(LOGOUT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '',
      });

      if (response.ok) {
        auth.logout();
      } else {
        setError('Logout failed. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-card rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-foreground">Logout</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <p className="mb-6 text-gray-700">
        Are you sure you want to logout? You will need to login again to access your account.
      </p>

      <div className="space-y-3">
        <button
          onClick={handleLogout}
          disabled={loading}
          className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Logging out...' : 'Yes, Logout'}
        </button>
        <Link
          href="/"
          className="block w-full bg-gray-200 text-gray-800 py-2 rounded-lg text-center hover:bg-gray-300"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}