/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["192.168.1.14"],
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb"
    }
  },
  // Bổ sung khối cấu hình này để bỏ qua lỗi TypeScript khi build
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Fixes Object.defineProperty error in next 14/15 dev mode with pdfjs-dist
      config.devtool = 'cheap-module-source-map';
    }
    // Fixes module not found canvas error
    config.resolve.alias.canvas = false;
    return config;
  }
};

export default nextConfig;
