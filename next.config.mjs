  /** @type {import('next').NextConfig} */

  const allowedOrigins = process.env.ALLOWED_DEV_ORIGINS
    ? process.env.ALLOWED_DEV_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
    : [];

  const djangoBaseUrl = process.env.NEXT_PUBLIC_DJANGO_BASE_URL || process.env.DJANGO_BASE_URL || 'http://127.0.0.1:8001';

  const nextConfig = {
    allowedDevOrigins: ['127.0.0.1', 'localhost', ...allowedOrigins],

    rewrites: async () => {
      return {
        beforeFiles: [
          {
            source: '/media/:path*',
            destination: `${djangoBaseUrl}/media/:path*`,
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
              value: 'same-origin-allow-popups',
            },
          ],
        },
      ];
    },
  };

export default nextConfig;