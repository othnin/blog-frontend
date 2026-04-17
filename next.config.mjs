/** @type {import('next').NextConfig} */

// Parse comma-separated LAN IPs/hostnames from ALLOWED_DEV_ORIGINS env var
// Allows HMR connections from other devices on the network (e.g. phone, second computer)
const allowedOrigins = process.env.ALLOWED_DEV_ORIGINS
  ? process.env.ALLOWED_DEV_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : [];

const nextConfig = {
  // Only add allowedDevOrigins if origins are configured
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
};

export default nextConfig;
