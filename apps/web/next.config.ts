import type { NextConfig } from "next";

/** apps/api — trình duyệt gọi /api/* cùng origin, Next chuyển tiếp sang API (cookie httpOnly đi kèm). */
const API_URL = process.env.API_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  // Chạy dưới đường dẫn con khi deploy (vd. /pkan); rewrite /api cũng tự nằm dưới tiền tố.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  // Nút dev tools sang phải để không đè khối người dùng ở đáy thanh bên.
  devIndicators: { position: "bottom-right" },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
