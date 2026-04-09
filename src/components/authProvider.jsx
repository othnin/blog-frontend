'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { fetchWithAuth } from '@/lib/tokenUtils';

const AuthContext = createContext(null);

const LOGIN_REDIRECT_URL = '/';
const LOGOUT_REDIRECT_URL = '/login';
const LOGIN_REQUIRED_URL = '/login';
const LOCAL_STORAGE_KEY = 'is-logged-in';
const LOCAL_USERNAME_KEY = 'username';
const LOCAL_ACCESS_TOKEN_KEY = 'access_token';
const LOCAL_REFRESH_TOKEN_KEY = 'refresh_token';

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleSessionExpired = () => loginRequiredRedirect();
    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, [pathname]);

  useEffect(() => {
    const storedAuthStatus = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedAuthStatus) {
      const storedAuthStatusInt = parseInt(storedAuthStatus);
      setIsAuthenticated(storedAuthStatusInt === 1);
    }
    const storedUn = localStorage.getItem(LOCAL_USERNAME_KEY);
    if (storedUn) {
      setUsername(storedUn);
    }
    setLoading(false);
  }, []);

  // Fetch avatar when authenticated
  useEffect(() => {
    if (!isAuthenticated || loading) return;
    fetchWithAuth('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          const raw = data.profile?.avatar || null;
          // Strip the backend origin so the URL routes through the Next.js /media/* proxy
          const normalized = raw ? raw.replace(/^https?:\/\/[^/]+/, '') : null;
          setAvatar(normalized);
        }
      })
      .catch(() => {});
  }, [isAuthenticated, loading]);

  const login = (username) => {
    setIsAuthenticated(true);
    localStorage.setItem(LOCAL_STORAGE_KEY, '1');
    if (username) {
      localStorage.setItem(LOCAL_USERNAME_KEY, `${username}`);
      setUsername(username);
    } else {
      localStorage.removeItem(LOCAL_USERNAME_KEY);
    }
    const nextUrl = searchParams.get('next');
    const invalidNextUrl = ['/login', '/logout'];
    const nextUrlValid =
      nextUrl && nextUrl.startsWith('/') && !invalidNextUrl.includes(nextUrl);
    if (nextUrlValid) {
      router.replace(nextUrl);
      return;
    } else {
      router.replace(LOGIN_REDIRECT_URL);
      return;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.setItem(LOCAL_STORAGE_KEY, '0');
    router.replace(LOGOUT_REDIRECT_URL);
  };

  const loginRequiredRedirect = () => {
    // user is not logged in via API
    setIsAuthenticated(false);
    localStorage.setItem(LOCAL_STORAGE_KEY, '0');
    let loginWithNextUrl = `${LOGIN_REQUIRED_URL}?next=${pathname}`;
    if (LOGIN_REQUIRED_URL === pathname) {
      loginWithNextUrl = `${LOGIN_REQUIRED_URL}`;
    }
    router.replace(loginWithNextUrl);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        loginRequiredRedirect,
        username,
        avatar,
        setAvatar,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}