/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
  },
  trailingSlash: false,
  reactStrictMode: false,
  experimental: {
    serverActions: {},
  },
};

module.exports = nextConfig;
