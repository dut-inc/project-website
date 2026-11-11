/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The Pack moved under Board Games — keep old links and shared room codes working.
  async redirects() {
    return [
      { source: "/the-pack", destination: "/board-games/the-pack", permanent: true },
      { source: "/the-pack/:path*", destination: "/board-games/the-pack/:path*", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.nba.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "static.wikia.nocookie.net",
        pathname: "/**",
      },
      {
        // Field Watch upload photos live in Supabase Storage.
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

module.exports = nextConfig;
