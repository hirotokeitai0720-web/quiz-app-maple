/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // ← OK: VercelのNodeランタイム対応
  reactStrictMode: true, // ← ONで安全
  trailingSlash: false,
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: true, // ← こちらが今の推奨設定
  },
};

export default nextConfig;

