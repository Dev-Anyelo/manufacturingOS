/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gibhmqrnwmgllzpjpklv.supabase.co",
        pathname: "/storage/v1/object/**",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
  },
}

export default nextConfig
