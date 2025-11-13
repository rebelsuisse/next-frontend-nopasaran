import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // On ajoute une section 'env' pour exposer des variables au build
  /*env: {
    // La variable APP_VERSION sera disponible dans process.env
    APP_VERSION: process.env.VERCEL_GIT_COMMIT_REF || 'dev',
  },*/
  /* autres options de config ici */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.nopasaran.ch',
        port: '',
        pathname: '/uploads/**', // Autorise toutes les images dans le dossier d'upload
      },
      // Si vous avez aussi des images sur votre serveur de dev local
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '1337',
        pathname: '/uploads/**',
      }
    ],
  },
};

export default nextConfig;
