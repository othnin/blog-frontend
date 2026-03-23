/** @type {import('next').NextConfig} */
const nextConfig = {
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
