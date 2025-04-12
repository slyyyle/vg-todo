/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable webpack 5 for better CSS module support
  webpack: (config) => {
    // Add CSS loader configuration if needed
    return config;
  },
};

export default nextConfig;
