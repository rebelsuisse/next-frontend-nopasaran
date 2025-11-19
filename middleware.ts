import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

const locales = ['fr-CH', 'de-CH', 'it-CH', 'en'];
const defaultLocale = 'fr-CH';
const localePrefix = 'always';

export default createMiddleware({
  // La langue par défaut à utiliser si aucune n'est détectée
  defaultLocale: 'fr-CH',

  // La liste de toutes les langues supportées
  locales,

  // Le préfixe de chemin
  localePrefix,

  // NOUVELLE OPTION : Activer la détection automatique de la langue
  localeDetection: true
});

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  if (pathnameIsMissingLocale) {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname}`;
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    // Activer pour la page d'accueil (facultatif)
    '/',

    // Définir tous les chemins qui utiliseront le préfixe de langue
    '/(de-CH|fr-CH|it-CH|en)/:path*',

    // Activer un matcher pour exclure les fichiers importants.
    // Cela empêche le middleware de s'exécuter sur les requêtes pour :
    // - les routes API
    // - les assets Next.js (_next)
    // - les assets statiques (images, etc.)
    // - les fichiers de métadonnées (sitemap, robots, favicon, etc.)
    '/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js|robots.txt|sitemap.xml).*)'
  ]
};
