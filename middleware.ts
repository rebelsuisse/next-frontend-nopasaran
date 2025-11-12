// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const locales = ['fr', 'de', 'it', 'en']

export function middleware(request: NextRequest) {
  // Récupère le chemin de la requête
  const { pathname } = request.nextUrl

  // Vérifie si le chemin contient déjà une langue supportée
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (pathnameHasLocale) return

  // Si aucune langue n'est présente, redirige vers la langue par défaut (fr)
  // en conservant le reste du chemin.
  // Par exemple, /credits -> /fr/credits
  request.nextUrl.pathname = `/fr${pathname}`
  return NextResponse.redirect(request.nextUrl)
}

export const config = {
  // Ne pas exécuter le middleware pour les fichiers statiques ou les appels API de Next.js
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
