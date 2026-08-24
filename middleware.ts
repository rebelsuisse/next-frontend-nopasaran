import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';

const locales = ['fr-CH', 'de-CH', 'it-CH', 'en'];
const defaultLocale = 'fr-CH';

// Chemins dont le dernier segment est un slug propre à UNE langue.
// Cf. LOCALE_SPECIFIC_PREFIXES ci-dessous pour le pourquoi.
const LOCALE_SPECIFIC_PREFIXES = ['/the-wall-of-shame/'];

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
  const { pathname } = request.nextUrl;
  const hasLocalePrefix = locales.some(
    locale => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );

  // Un slug d'incident n'existe que dans SA langue : « ...-rejette-... » n'existe
  // qu'en fr-CH, « ...-rejects-... » qu'en en. Deviner le préfixe de langue via
  // Accept-Language sur une URL non préfixée produit donc une page inexistante
  // 3 fois sur 4 -- et Googlebot explore les sites multilingues avec plusieurs
  // Accept-Language, ce qui transformait ces URLs en vague de 404.
  // Pour ces chemins on force la langue par défaut : le slug par défaut y
  // résout, et le comportement redevient déterministe (donc cachable).
  // La détection reste active partout ailleurs : l'accueil et les pages
  // statiques existent dans les quatre langues, y deviner est sans risque.
  if (
    !hasLocalePrefix &&
    LOCALE_SPECIFIC_PREFIXES.some(prefix => pathname.startsWith(prefix))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname}`;
    return NextResponse.redirect(url, 308);
  }

  const response = intlMiddleware(request);

  // La redirection d'une URL sans préfixe de langue dépend d'Accept-Language.
  // Sans `Vary`, un CDN pourrait mettre en cache la redirection calculée pour
  // une langue et la servir à tout le monde.
  // On ne la pose que sur les redirections : les pages localisées ont chacune
  // leur propre URL et n'ont donc pas besoin de varier. La redirection forcée
  // ci-dessus n'en a pas besoin non plus, puisqu'elle ne dépend pas de la
  // langue du client.
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
