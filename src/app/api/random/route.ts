// src/app/api/random/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRandomIncident } from '@/lib/api';
import { resolveLocale } from '@/lib/seo';

// Cette route ne doit jamais être mise en cache, sinon on tomberait toujours sur le même !
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // On récupère la langue depuis l'URL (ex: /api/random?lang=fr-CH).
  // resolveLocale() la ramène à une locale connue : telle quelle, elle
  // atterrissait à la fois dans un new URL() (redirection ouverte) et dans la
  // requête Strapi (injection de paramètres). Cf. src/lib/seo.ts.
  const lang = resolveLocale(request.nextUrl.searchParams.get('lang'));

  try {
    // On appelle votre fonction existante dans api.ts
    const response = await getRandomIncident(lang);

    if (response.data && response.data.length > 0) {
      const slug = response.data[0].slug;
      // On redirige vers la page de l'incident

      return NextResponse.redirect(new URL(`/${lang}/the-wall-of-shame/${slug}?ctx=random`, request.url));
    }

    // Si aucun incident trouvé, retour à l'accueil
    return NextResponse.redirect(new URL(`/${lang}`, request.url));

  } catch (error) {
    console.error("Erreur random incident:", error);
    return NextResponse.redirect(new URL(`/${lang}`, request.url));
  }
}
