/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cada servidor de desarrollo usa su propia salida para permitir dev:a y dev:b al mismo tiempo.
  distDir: process.env.FULBO_NEXT_DIST_DIR || ".next",

   allowedDevOrigins: [
    "10.1.5.91",
    "192.168.56.1",
  ],
};

export default nextConfig;
