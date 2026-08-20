import createMiddleware from 'next-intl/middleware';

const locales = ['fr-CH', 'de-CH', 'it-CH', 'en'];

// Un SEUL export de middleware.
// Avant, ce fichier exportait à la fois un `export default createMiddleware(...)`
// et un `export function middleware(...)`. Next.js ne retient qu'un seul des
// deux, donc le middleware next-intl n'était jamais exécuté et `localeDetection`
// restait sans effet : toutes les requêtes atterrissaient sur /fr-CH.
// createMiddleware couvre déjà la redirection des URLs sans préfixe de langue
// (grâce à localePrefix: 'always'), la fonction manuelle était redondante.
export default createMiddleware({
  // La langue par défaut à utiliser si aucune n'est détectée
  defaultLocale: 'fr-CH',

  // La liste de toutes les langues supportées
  locales,

  // Le préfixe de chemin
  localePrefix: 'always',

  // Détection automatique de la langue (cookie NEXT_LOCALE, puis Accept-Language)
  localeDetection: true
});

export const config = {
  // On ignore :
  // - /api (routes API)
  // - /_next (fichiers internes Next.js)
  // - /_vercel (fichiers internes Vercel)
  // - .*\\..* (Tous les fichiers qui ont un point, ex: robots.txt, sitemap.xml, favicon.ico)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
