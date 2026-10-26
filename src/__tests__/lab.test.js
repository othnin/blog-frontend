/**
 * @jest-environment node
 *
 * The /lab entry point is a 307 to /thales/ on the same origin. It must use an
 * absolute URL because Response.redirect() rejects relative URLs, but that URL
 * still has to point at the incoming origin so the auth cookie is preserved.
 */
import { GET } from '@/app/lab/route';

function req(path) {
  return new Request(`http://localhost:3000${path}`);
}

describe('/lab redirect', () => {
  it('redirects to /thales/ on the same origin', () => {
    const res = GET(req('/lab'));

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/thales/');
  });
});
