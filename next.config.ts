import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // On ajoute une section 'env' pour exposer des variables au build
  /*env: {
    // La variable APP_VERSION sera disponible dans process.env
    APP_VERSION: process.env.VERCEL_GIT_COMMIT_REF || 'dev',
  },*/
  /* autres options de config ici */
};

export default nextConfig;
