import { NextRequest, NextResponse } from 'next/server';

const locales = ['fr-CH', 'de-CH', 'it-CH', 'en'];
const defaultLocale = 'fr-CH';

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
  matcher: [ '/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js).*)' ],
};
