  /** @type {import('next').Config} */
  import { requireDjangoBaseUrl } from './src/lib/backendUrl.mjs';

  const allowedOrigins = process.env.ALLOWED_DEV_ORIGINS
    ? process.env.ALLOWED_DEV_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
    : [];

  // Function form so we know whether we are building or serving. Building
  // without DJANGO_BASE_URL must not fail — Railway only exposes service
  // variables to the build when they are configured for it — but serving
  // without it must, rather than silently proxying /api to 127.0.0.1:8001
  // inside a container that has nothing listening there.
  export default (phase) => {
    const djangoBaseUrl = requireDjangoBaseUrl({ phase });

    const nextConfig = {
      allowedDevOrigins: ['127.0.0.1', 'localhost', ...allowedOrigins],

      // Django admin URLs always end in a slash and Django's CommonMiddleware
      // (APPEND_SLASH) 301-redirects to add it, while Next's default is a 308
      // that *removes* it. Those two fight into an infinite redirect loop when
      // /django-admin/* is proxied through Next. This flag stops Next's 308 so
      // the slash survives to Django. It also has to be on for src/middleware.ts
      // to even see the trailing-slash path: Next's redirect runs first otherwise.
      skipTrailingSlashRedirect: true,

      rewrites: async () => {
        return {
          beforeFiles: [
            {
              // Local dev glue: in dev, AWS_STORAGE_BUCKET_NAME is unset, so Django serves MEDIA_ROOT directly via /media/* routes.
              // In production, all storage URLs are fully-qualified presigned URLs, so this rewrite is inert.
              source: '/media/:path*',
              destination: `${djangoBaseUrl}/media/:path*`,
            },
            {
              // Django admin (STATIC_URL is an absolute /static/) loads its CSS
              // and JS from /static/admin/*. Proxy those so the admin isn't
              // served unstyled/broken when accessed through the frontend domain.
              source: '/static/:path*',
              destination: `${djangoBaseUrl}/static/:path*`,
            },
          ],
          fallback: [
            {
              source: '/api/:path*',
              destination: `${djangoBaseUrl}/api/:path*`,
            },
          ],
        };
      },

      async headers() {
        return [
          {
            source: '/:path(.*)',
            headers: [
              {
                key: 'Cross-Origin-Opener-Policy',
                value: 'same-origin-allow-popens',
              },
            ],
          },
        ];
      },
    };

    return nextConfig;
  };
