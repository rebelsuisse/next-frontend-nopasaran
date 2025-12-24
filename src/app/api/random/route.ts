// src/app/api/random/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRandomIncident } from '@/lib/api';

// Cette route ne doit jamais être mise en cache, sinon on tomberait toujours sur le même !
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // On récupère la langue depuis l'URL (ex: /api/random?lang=fr-CH)
  const searchParams = request.nextUrl.searchParams;
  const lang = searchParams.get('lang') || 'fr-CH';

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