/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cada servidor de desarrollo usa su propia salida para permitir dev:a y dev:b al mismo tiempo.
  distDir: process.env.NEXT_DIST_DIR || ".next",

};

export default nextConfig;
