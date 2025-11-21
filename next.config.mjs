// next.config.mjs
import createMDX from "@next/mdx";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

// ON RETIRE LES OPTIONS QUI POSENT PROBLÈME ICI
const withMDX = createMDX({
  // On laisse vide ou juste l'extension, car vos pages .mdx sont gérées manuellement ailleurs
});

// --- Récupération Variable Env ---
const strapiEnvUrl = process.env.NEXT_PUBLIC_STRAPI_HOST || "http://127.0.0.1:1337";
const strapiUrl = new URL(strapiEnvUrl);

// --- CSP ---
function getCsp() {
  const strapiOrigin = strapiUrl.origin; 
  const csp = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://va.vercel-scripts.com"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", "blob:", "data:", "https:", strapiOrigin], 
    'font-src': ["'self'", "data:"],
    'connect-src': ["'self'", "https://formspree.io", "https:", strapiOrigin],
    'frame-ancestors': ["'none'"],
    'form-action': ["'self'", "https://formspree.io"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
  };

  return Object.entries(csp)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: getCsp() },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: strapiUrl.protocol.replace(':', ''),
        hostname: strapiUrl.hostname,
        port: strapiUrl.port || undefined,
        pathname: '/uploads/**',
      },
    ],
  },
  pageExtensions: ["md", "mdx", "ts", "tsx"],
};

export default withNextIntl(withMDX(nextConfig));