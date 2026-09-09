import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // admins can point promo/product banners at any hosted image URL
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
