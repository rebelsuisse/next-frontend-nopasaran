// middleware.ts - Doit être à la racine du projet
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware';
import {locales, localePrefix} from './src/navigation';

// Définissez vos langues supportées
// const locales = ['fr-CH', 'de-CH', 'it-CH', 'en'] 
const defaultLocale = 'fr-CH'

export default createMiddleware({
  // La langue par défaut à utiliser si aucune n'est détectée
  defaultLocale: 'fr-CH',
  
  // La liste de toutes les langues supportées
  locales,

  // Le préfixe de chemin
  localePrefix
});

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 1. Vérifie si le chemin contient déjà une langue supportée
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (pathnameHasLocale) return

  // 2. Si aucune langue n'est présente, redirige vers la langue par défaut
  //    /credits -> /fr-CH/credits
  //    /        -> /fr-CH
  request.nextUrl.pathname = `/${defaultLocale}${pathname}`
  return NextResponse.redirect(request.nextUrl)
}

export const config = {
  // Ne pas exécuter le middleware sur les fichiers statiques ou les appels API de Next.js
  matcher: [
    // Enable a redirect to a matching locale at the root
    '/',
 
    // Set a cookie to remember the previous locale for
    // all requests that have a locale prefix
    '/(de-CH|fr-CH|it-CH|en-US)/:path*',
 
    // Enable redirects that add a locale prefix
    // (e.g. `/pathnames` -> `/en/pathnames`)
    '/((?!_next|.*\\..*).*)'
  ]
};
