// middleware.ts - Doit être à la racine du projet
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Définissez vos langues supportées
const locales = ['fr-CH', 'de-CH', 'it-CH', 'en'] 
const defaultLocale = 'fr-CH'

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
  // Exécute le middleware sur toutes les routes, sauf les fichiers statiques, etc.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
}
