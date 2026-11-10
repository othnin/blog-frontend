/**
 * @jest-environment node
 *
 * The /lab entry point is a 307 to /thales/ on the same origin. It uses a
 * relative Location header so the browser resolves it against the public
 * origin it requested, even when the Next server sits behind a proxy and only
 * knows its internal address (the production bug was a redirect to
 * http://localhost:8080/thales/).
 */
import { GET } from '@/app/lab/route';

function req(path, headers = {}) {
  return new Request(`http://localhost:3000${path}`, { headers });
}

describe('/lab redirect', () => {
  it('redirects to /thales/ with a relative Location', () => {
    const res = GET(req('/lab'));

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('/thales/');
  });

  it('does not leak the internal proxy address into the redirect', () => {
    const res = GET(
      req('/lab', {
        host: 'localhost:8080',
        'x-forwarded-host': 'localhost:8080',
        'x-forwarded-proto': 'http',
      }),
    );

    expect(res.headers.get('location')).toBe('/thales/');
    expect(res.headers.get('location')).not.toContain('localhost');
  });
});
