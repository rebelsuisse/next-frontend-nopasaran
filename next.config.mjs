// next.config.mjs
import createMDX from "@next/mdx";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const withMDX = createMDX({});

const isDev = process.env.NODE_ENV === 'development';

// The only origin the browser loads from besides our own: Strapi, for incident
// images (the Instagram story button also re-fetches them to draw the PNG).
// Derived from the env so `next dev` against a local Strapi keeps working.
const strapiOrigin = new URL(process.env.NEXT_PUBLIC_STRAPI_HOST || 'https://api.nopasaran.ch').origin;

// Content-Security-Policy (security review, finding M-6).
// - 'unsafe-eval' only in development: React needs it there for error overlays;
//   neither React nor Next.js uses eval in production.
// - img-src / connect-src name exact origins instead of a blanket `https:`.
//   Bluesky, Instagram, Brevo and Google Fonts are only called server-side,
//   where CSP does not apply.
// - script-src keeps 'unsafe-inline': every App Router page embeds per-page
//   inline scripts (self.__next_f.push), and Cloudflare injects its bot
//   detection inline. Dropping it needs per-request nonces, which force every
//   page to render dynamically (no static pages, no ISR, no CDN caching).
// - style-src keeps 'unsafe-inline': React `style` attributes need it, and
//   nonces do not cover style attributes.
// - upgrade-insecure-requests only in production: it would turn a local
//   http://localhost:1337 Strapi into an https URL that does not exist.
const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://va.vercel-scripts.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: ${strapiOrigin};
    font-src 'self' data:;
    object-src 'none';
    base-uri 'self';
    form-action 'self' https://formspree.io;
    frame-ancestors 'none';
    connect-src 'self' https://formspree.io ${strapiOrigin};
    ${isDev ? '' : 'upgrade-insecure-requests;'}
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
