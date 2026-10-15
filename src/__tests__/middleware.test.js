/**
 * @jest-environment node
 *
 * Tests for src/middleware.ts — the /dashboard -> /home permanent redirect and
 * the Django admin proxy rewrite.
 */
import { NextRequest } from 'next/server';
import { middleware, config } from '@/middleware';

function req(path) {
  return new NextRequest(`http://localhost:3000${path}`);
}

describe('middleware: /dashboard -> /home redirect', () => {
  it('permanently redirects /dashboard to /home', () => {
    const res = middleware(req('/dashboard'));
    expect(res.status).toBe(308);
    expect(res.headers.get('location')).toBe('http://localhost:3000/home');
  });

  it('preserves the sub-path', () => {
    const res = middleware(req('/dashboard/edit/5'));
    expect(res.status).toBe(308);
    expect(res.headers.get('location')).toBe('http://localhost:3000/home/edit/5');
  });

  it('preserves the query string', () => {
    const res = middleware(req('/dashboard/create-post?draft=1'));
    expect(res.status).toBe(308);
    expect(res.headers.get('location')).toBe(
      'http://localhost:3000/home/create-post?draft=1',
    );
  });

  it('matches dashboard routes in config', () => {
    expect(config.matcher).toEqual(
      expect.arrayContaining(['/dashboard', '/dashboard/:path*']),
    );
  });
});

describe('middleware: django-admin proxy', () => {
  it('rewrites /django-admin/* to the backend', () => {
    const res = middleware(req('/django-admin/login/'));
    expect(res.headers.get('x-middleware-rewrite')).toContain('/django-admin/login/');
  });
});
