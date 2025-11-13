import type { NextConfig } from "next";

import createNextIntlPlugin from 'next-intl/plugin';
 
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // On ajoute une section 'env' pour exposer des variables au build
  /*env: {
    // La variable APP_VERSION sera disponible dans process.env
    APP_VERSION: process.env.VERCEL_GIT_COMMIT_REF || 'dev',
  },*/
  /* autres options de config ici */
  images: {
    // On n'utilise QUE remotePatterns
    remotePatterns: [
      // Règle pour la production
      {
        protocol: 'https',
        hostname: 'api.nopasaran.ch',
        port: '', // Le port par défaut pour HTTPS est 443, donc on le laisse vide
        pathname: '/uploads/**',
      },
      // Règle pour le développement local
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '1337', // Le port doit être spécifié
        pathname: '/uploads/**',
      },
      // Règle de secours pour les adresses IP privées si 'localhost' échoue
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '1337',
        pathname: '/uploads/**',
      },
    ],
  },
};

module.exports = withNextIntl(nextConfig);
export default nextConfig;
