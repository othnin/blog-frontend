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
    expect(res.headers.get('location')).toBe('/home');
  });

  it('preserves the sub-path', () => {
    const res = middleware(req('/dashboard/edit/5'));
    expect(res.status).toBe(308);
    expect(res.headers.get('location')).toBe('/home/edit/5');
  });

  it('preserves the query string', () => {
    const res = middleware(req('/dashboard/create-post?draft=1'));
    expect(res.status).toBe(308);
    expect(res.headers.get('location')).toBe('/home/create-post?draft=1');
  });

  it('does not leak the internal proxy address into the redirect', () => {
    const res = middleware(
      new NextRequest('http://localhost:8080/dashboard/edit/5', {
        headers: {
          host: 'localhost:8080',
          'x-forwarded-host': 'localhost:8080',
          'x-forwarded-proto': 'http',
        },
      }),
    );

    expect(res.headers.get('location')).toBe('/home/edit/5');
    expect(res.headers.get('location')).not.toContain('localhost');
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

describe('middleware: Thales lab proxy', () => {
  it('rewrites /thales/ to the backend', () => {
    const res = middleware(req('/thales/'));

    expect(res.headers.get('x-middleware-rewrite')).toContain('/thales/');
  });

  it('rewrites hashed assets under /thales/assets/', () => {
    const res = middleware(req('/thales/assets/index-abc123.js'));

    expect(res.headers.get('x-middleware-rewrite')).toContain(
      '/thales/assets/index-abc123.js',
    );
  });

  it('matches thales routes in config', () => {
    expect(config.matcher).toEqual(
      expect.arrayContaining(['/thales', '/thales/:path*']),
    );
  });
});
