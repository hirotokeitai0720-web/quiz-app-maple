/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",  // ← これを追加！
  experimental: {
    appDir: true,        // ← App Router使用時に推奨
  },
};

module.exports = nextConfig;
