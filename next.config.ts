import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: [
    "firebase-admin",
    "@google-cloud/firestore",
    "@google-cloud/storage",
    "@opentelemetry/api",
    "undici",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",  // allow up to 5MB (gambar sudah dikompresi ke ≤1MB)
    },
  },
};

export default nextConfig;
