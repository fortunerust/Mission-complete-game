/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', pathname: '/**' },
    ],
  },
  // Disable static optimization for error pages
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
}

module.exports = nextConfig
