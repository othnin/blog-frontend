/** @type {import('next').NextConfig} */
const nextConfig = {
  rewrites: async () => {
    return {
      afterFiles: [
        {
          source: '/api/:path*',
          destination: 'http://localhost:8001/api/:path*',
        },
      ],
    };
  },
};

export default nextConfig;
