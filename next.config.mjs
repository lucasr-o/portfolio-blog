/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  transpilePackages: ["@portfolio/blog-content", "@portfolio/blog-ui"],
  poweredByHeader: false,
  reactStrictMode: true,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  experimental: { globalNotFound: true },
};

export default nextConfig;
