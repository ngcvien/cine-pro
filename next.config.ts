import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com/__/auth/:path*`,
      },
    ];
  },
  serverExternalPackages: ['firebase-admin'],

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY', // Chặn không cho web khác nhúng iframe
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // Chặn trình duyệt đoán mò kiểu file
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin', // Bảo mật thông tin người dùng đi từ đâu tới
          },
        ],
      },
    ];
  },
};

export default nextConfig;
