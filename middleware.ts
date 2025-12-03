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
  // On ignore :
  // - /api (routes API)
  // - /_next (fichiers internes Next.js)
  // - /_vercel (fichiers internes Vercel)
  // - .*\\..* (Tous les fichiers qui ont un point, ex: robots.txt, sitemap.xml, favicon.ico)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
