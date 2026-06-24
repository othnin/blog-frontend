  /** @type {import('next').NextConfig} */

  const allowedOrigins = process.env.ALLOWED_DEV_ORIGINS
    ? process.env.ALLOWED_DEV_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
    : [];

  const nextConfig = {
    ...(allowedOrigins.length > 0 && { allowedDevOrigins: allowedOrigins }),

    rewrites: async () => {
      return {
        fallback: [
          {
            source: '/api/:path*',
            destination: 'http://127.0.0.1:8001/api/:path*',
          },
          {
            source: '/media/:path*',
            destination: 'http://127.0.0.1:8001/media/:path*',
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
            {
              key: 'Cross-Origin-Embedder-Policy',
              value: 'require-corp',
            },
          ],
        },
      ];
    },
  };