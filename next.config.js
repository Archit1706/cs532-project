/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['randomuser.me'],
  },
  rewrites: async () => {
    return [
      {
        source: '/api/:path*',
        destination: 'https://cs532-project.onrender.com/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;