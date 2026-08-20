import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';

const locales = ['fr-CH', 'de-CH', 'it-CH', 'en'];

// Un SEUL export de middleware.
// Avant, ce fichier exportait à la fois un `export default createMiddleware(...)`
// et un `export function middleware(...)`. Next.js ne retient qu'un seul des
// deux, donc le middleware next-intl n'était jamais exécuté et `localeDetection`
// restait sans effet : toutes les requêtes atterrissaient sur /fr-CH.
// createMiddleware couvre déjà la redirection des URLs sans préfixe de langue
// (grâce à localePrefix: 'always'), la fonction manuelle était redondante.
const intlMiddleware = createMiddleware({
  // La langue par défaut à utiliser si aucune n'est détectée
  defaultLocale: 'fr-CH',

  // La liste de toutes les langues supportées
  locales,

  // Le préfixe de chemin
  localePrefix: 'always',

  // Détection automatique de la langue (cookie NEXT_LOCALE, puis Accept-Language)
  localeDetection: true
});

export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request);

  // La redirection d'une URL sans préfixe de langue dépend maintenant de
  // Accept-Language. Sans `Vary`, un CDN pourrait mettre en cache la
  // redirection calculée pour une langue et la servir à tout le monde.
  // On ne la pose que sur les redirections : les pages localisées ont chacune
  // leur propre URL et n'ont donc pas besoin de varier.
  if (response.status >= 300 && response.status < 400) {
    const vary = response.headers.get('Vary');
    if (!vary) {
      response.headers.set('Vary', 'Accept-Language');
    } else if (!vary.toLowerCase().includes('accept-language')) {
      response.headers.set('Vary', `${vary}, Accept-Language`);
    }
  }

  return response;
}

export const config = {
  // On ignore :
  // - /api (routes API)
  // - /_next (fichiers internes Next.js)
  // - /_vercel (fichiers internes Vercel)
  // - .*\\..* (Tous les fichiers qui ont un point, ex: robots.txt, sitemap.xml, favicon.ico)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
