import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Coolify/Docker deploy için minimal bağımsız çıktı (nixpacks veya Dockerfile).
  output: "standalone",
};

export default nextConfig;
