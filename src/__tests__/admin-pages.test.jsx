/**
 * Tests for ADMIN-011 to ADMIN-016: Admin pages and API proxy
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminLayout from '@/app/admin/layout';
import AdminDashboardPage from '@/app/admin/page';
import AdminUsersPage from '@/app/admin/users/page';
import AdminPostsPage from '@/app/admin/posts/page';
import AdminCategoriesPage from '@/app/admin/categories/page';
import { useRouter, usePathname } from 'next/navigation';
import { fetchWithAuth } from '@/lib/tokenUtils';
import { getToken } from '@/lib/auth';
import { getDjangoBaseUrl } from '@/lib/backendUrl.mjs';
import * as adminProxy from '@/app/api/admin/[...path]/route';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock('next/link', () => {
  function MockLink({ href, children, ...props }) {
    return <a href={href} {...props}>{children}</a>;
  }
  return MockLink;
});

jest.mock('@/components/authProvider', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/tokenUtils', () => ({
  fetchWithAuth: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logError: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  getToken: jest.fn(),
}));

jest.mock('@/lib/backendUrl.mjs', () => ({
  getDjangoBaseUrl: jest.fn(),
}));

jest.mock('@/config/categoryImages', () => ({
  getCategoryImage: jest.fn(() => null),
}));

const mockUseAuth = require('@/components/authProvider').useAuth;
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockGetToken = getToken;
const mockGetDjangoBaseUrl = getDjangoBaseUrl;

const ok = (data) =>
  Promise.resolve({ ok: true, status: 200, json: async () => data });
const fail = (data = { detail: 'Error' }, status = 400) =>
  Promise.resolve({ ok: false, status, json: async () => data });

beforeEach(() => {
  jest.resetAllMocks();
  global.fetch = jest.fn();
  useRouter.mockReturnValue({ push: mockPush, replace: mockReplace });
  usePathname.mockReturnValue('/admin');
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

describe('AdminLayout', () => {
  it('redirects to /login when not authenticated', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, loading: false });
    render(<AdminLayout>children</AdminLayout>);
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/login'));
  });

  it('shows loading while checking auth', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: null, loading: true });
    render(<AdminLayout>children</AdminLayout>);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('checks role and renders children for admin', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false, username: 'root' });
    fetchWithAuth.mockResolvedValueOnce(ok({ profile: { role: 'admin' } }));
    render(<AdminLayout>children</AdminLayout>);
    await waitFor(() => expect(screen.getByText('children')).toBeInTheDocument());
  });

  it('redirects to /home if not admin', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    fetchWithAuth.mockResolvedValueOnce(ok({ profile: { role: 'reader' } }));
    render(<AdminLayout>children</AdminLayout>);
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/home'));
  });

  it('redirects to /home on error fetching profile', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    fetchWithAuth.mockResolvedValueOnce(fail());
    render(<AdminLayout>children</AdminLayout>);
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/home'));
  });
});
describe('AdminDashboardPage', () => {
  it('renders loading state initially', () => {
    global.fetch.mockResolvedValue(ok({}));
    render(<AdminDashboardPage />);
    expect(screen.getByText('Loading stats...')).toBeInTheDocument();
  });

  it('renders stats on success', async () => {
    global.fetch.mockResolvedValueOnce(ok({
      total_users: 10, total_posts: 5, published_posts: 4, draft_posts: 1,
      total_views: 100, total_likes: 20, total_comments: 5,
      total_categories: 3, new_users_this_month: 2,
    }));
    render(<AdminDashboardPage />);
    await waitFor(() => expect(screen.getByText('Admin Dashboard')).toBeInTheDocument());
  });

  it('shows error on failure', async () => {
    global.fetch.mockResolvedValueOnce(fail({ detail: 'boom' }, 500));
    render(<AdminDashboardPage />);
    await waitFor(() => expect(screen.getByText(/Failed to load dashboard stats/i)).toBeInTheDocument());
  });
});

describe('AdminUsersPage', () => {
  const USERS = [{
    id: 1, username: 'alice', email: 'alice@example.com',
    profile: { role: 'editor', is_suspended: false }, is_active: true, date_joined: '2026-01-01T00:00:00Z',
  }];
  it('renders loading initially', () => {
    global.fetch.mockResolvedValue(ok([]));
    render(<AdminUsersPage />);
    expect(screen.getByText('Loading users...')).toBeInTheDocument();
  });
  it('renders users table', async () => {
    global.fetch.mockResolvedValueOnce(ok(USERS));
    render(<AdminUsersPage />);
    await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument());
  });
});
describe('AdminPostsPage', () => {
  const POSTS = [{
    id: 1, title: 'Test Post', slug: 'test-post', author_username: 'alice',
    status: 'draft', view_count: 5, like_count: 2, category_name: 'Tech', created_at: '2026-01-01T00:00:00Z',
  }];
  it('renders loading initially', () => {
    global.fetch.mockResolvedValue(ok([]));
    render(<AdminPostsPage />);
    expect(screen.getByText('Loading posts...')).toBeInTheDocument();
  });
  it('renders posts table', async () => {
    global.fetch.mockResolvedValueOnce(ok(POSTS));
    render(<AdminPostsPage />);
    await waitFor(() => expect(screen.getByText('Test Post')).toBeInTheDocument());
  });
});

describe('AdminCategoriesPage', () => {
  const CATS = [{ id: 1, name: 'Tech', slug: 'tech', post_count: 5, image_url: null }];
  it('renders loading initially', () => {
    global.fetch.mockResolvedValue(ok([]));
    render(<AdminCategoriesPage />);
    expect(screen.getByText('Loading categories...')).toBeInTheDocument();
  });
  it('renders categories grid', async () => {
    global.fetch.mockResolvedValueOnce(ok(CATS));
    render(<AdminCategoriesPage />);
    await waitFor(() => expect(screen.getByText('Tech')).toBeInTheDocument());
  });
});
describe('Admin API Proxy', () => {
  beforeEach(() => {
    mockGetToken.mockResolvedValue('test-token');
    mockGetDjangoBaseUrl.mockReturnValue('http://localhost:8001'); global.__TEST_DJANGO_BASE__='http://localhost:8001';
  });

  it('returns 401 if not authenticated', async () => {
    mockGetToken.mockResolvedValueOnce(null);
    const req = new Request('http://localhost:3000/api/admin/dashboard/');
    const res = await adminProxy.GET(req, { params: Promise.resolve({ path: ['dashboard'] }) });
    expect(res.status).toBe(401);
  });

  it('proxies GET requests', async () => {
    global.fetch.mockResolvedValueOnce(
      Promise.resolve(new Response(JSON.stringify({ data: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
    );
    const req = new Request('http://localhost:3000/api/admin/dashboard/');
    const res = await adminProxy.GET(req, { params: Promise.resolve({ path: ['dashboard'] }) });
    expect(res.status).toBe(200);
  });

  it('passes query params', async () => {
    global.fetch.mockResolvedValueOnce(
      Promise.resolve(new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }))
    );
    const req = new Request('http://localhost:3000/api/admin/users/?search=alice&role=editor');
    await adminProxy.GET(req, { params: Promise.resolve({ path: ['users'] }) });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/users/?search=alice&role=editor'),
      expect.any(Object)
    );
  });

  it('handles POST requests with JSON body', async () => {
    global.fetch.mockResolvedValueOnce(
      Promise.resolve(new Response('{}', { status: 201, headers: { 'Content-Type': 'application/json' } }))
    );
    const req = new Request('http://localhost:3000/api/admin/categories/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' }),
    });
    const res = await adminProxy.POST(req, { params: Promise.resolve({ path: ['categories'] }) });
    expect(res.status).toBe(201);
  });

  it('handles multipart uploads', async () => {
    global.fetch.mockResolvedValueOnce(
      Promise.resolve(new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }))
    );
    const form = new FormData();
    form.append('file', new Blob(['x'], { type: 'image/png' }));
    const req = new Request('http://localhost:3000/api/admin/categories/1/image/', {
      method: 'POST',
      body: form,
    });
    const res = await adminProxy.POST(req, { params: Promise.resolve({ path: ['categories', '1', 'image'] }) });
    expect(res.status).toBe(200);
  });

  it('returns 502 on connection error', async () => {
    const err = new Error('ECONNREFUSED');
    err.cause = { code: 'ECONNREFUSED' };
    global.fetch.mockRejectedValueOnce(err);
    const req = new Request('http://localhost:3000/api/admin/dashboard/');
    const res = await adminProxy.GET(req, { params: Promise.resolve({ path: ['dashboard'] }) });
    expect(res.status).toBe(502);
  });
});
if (typeof Request === 'undefined') {
  global.Request = class Request {
    constructor(url, init = {}) {
      this.url = url;
      this.method = init.method || 'GET';
      this.headers = new Map(Object.entries(init.headers || {}));
      this._body = init.body;
    }
    async text() { return typeof this._body === 'string' ? this._body : String(this._body || ''); }
    async json() { try { return JSON.parse(await this.text()); } catch { return {}; } }
    async blob() { return this._body instanceof Blob ? this._body : new Blob([await this.text()]); }
  };
}
if (typeof Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init = {}) {
      this._body = body;
      this.status = init.status || 200;
      this.headers = new Map();
      if (init.headers) {
        Object.entries(init.headers).forEach(([k,v]) => this.headers.set(k,v));
      }
    }
    async text() { return typeof this._body === 'string' ? this._body : String(this._body || ''); }
    async json() { try { return JSON.parse(await this.text()); } catch { return {}; } }
    get ok() { return this.status >= 200 && this.status < 300; }
  };
}
