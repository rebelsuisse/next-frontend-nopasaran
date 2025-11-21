// next.config.mjs
import createMDX from "@next/mdx";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const withMDX = createMDX({
  // On laisse vide, vos pages .mdx sont gérées manuellement
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // --- ZONE DE TEST : On commente les headers pour l'instant ---
  // C'est probablement l'un de ces headers qui fâche Cloudflare ou Vercel pendant le build
  /*
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // { key: 'Content-Security-Policy', value: ... }, 
        ],
      },
    ];
  },
  */

  images: {
    // On remet la config "en dur" comme dans la version qui marche
    // pour être sûr que le problème ne vient pas du parsing 'new URL()'
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.nopasaran.ch',
        port: '',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '1337',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '1337',
        pathname: '/uploads/**',
      },
    ],
  },
  pageExtensions: ["md", "mdx", "ts", "tsx"],
};

export default withNextIntl(withMDX(nextConfig));