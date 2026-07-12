/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  
  // Turbopack configuration
  turbopack: {},
  
  // Environment variables
  env: {
    NEXT_PUBLIC_PDFJS_VERSION: '3.11.174',
  },
};

export default nextConfig;
