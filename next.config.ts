import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  serverExternalPackages: [
    "firebase-admin",
    "firebase-admin/app",
    "firebase-admin/firestore",
    "firebase-admin/auth",
    "firebase-admin/storage",
    "firebase-admin/database",
    "firebase-admin/messaging",
  ],
};

export default nextConfig;
