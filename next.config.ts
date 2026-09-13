import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Server Actions default to a 1MB request body limit. createListing and
  // updateListing submit up to 5 client-compressed photos as multipart
  // form data — comfortably over 1MB even after compression — which was
  // failing every listing submission with photos as a generic 413 that
  // surfaced to users as "This page hit a snag."
  experimental: {
    serverActions: {
      bodySizeLimit: "4.5mb",
    },
  },
  // www and the pre-migration vercel.app alias still resolve with identical
  // content to the apex domain — that's duplicate content to search engines
  // and stale links for anyone who bookmarked the old address.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.campusbin.in" }],
        destination: "https://campusbin.in/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "my-marketplace-red.vercel.app" }],
        destination: "https://campusbin.in/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "clpfcygjtkjeafvscdwb.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "fastly.picsum.photos",
      },
    ],
  },
};

export default nextConfig;
