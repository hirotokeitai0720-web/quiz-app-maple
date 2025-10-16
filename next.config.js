/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",   // ← Nodeランタイムで動作
  experimental: {
    appDir: true,
  },
  // 静的エクスポートではなくSSRを有効化
  images: {
    unoptimized: true,
  },
  trailingSlash: false, // ファイル末尾の「/」による静的化防止
  reactStrictMode: false,
};

module.exports = nextConfig;
