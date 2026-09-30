// next.config.mjs
import createMDX from "@next/mdx";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const withMDX = createMDX({});

// CSP PROPRE (Sans localhost)
const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https: https://api.nopasaran.ch;
    font-src 'self' data:;
    object-src 'none';
    base-uri 'self';
    form-action 'self' https://formspree.io;
    frame-ancestors 'none';
    connect-src 'self' https://formspree.io https: https://api.nopasaran.ch;
`.replace(/\s{2,}/g, ' ').trim();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Masque le fait que vous utilisez Next.js (Sécurité par obscurité)
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Clickjacking protection comes from `frame-ancestors 'none'` in the
          // CSP above, which supersedes X-Frame-Options in current browsers.
          // (It used to allow tagassistant.google.com for the Google Ads tag,
          // removed on 2026-09-30.)
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: cspHeader },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.nopasaran.ch',
        port: '',
        pathname: '/uploads/**',
      },
      // On peut laisser localhost ici pour le dev local, ça ne sort pas dans les headers HTTP
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
