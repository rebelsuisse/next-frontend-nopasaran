// src/app/api/social/image/[locale]/[documentId]/route.ts

import { getIncidentByDocumentId } from '@/lib/api';
import { LOCALES, type Locale } from '@/lib/seo';
import { renderSlide } from '@/social/card';

/**
 * Public JPEG images of a fiche, fetched by Instagram when it publishes a
 * post (Instagram needs public image URLs). Only renders public Strapi data.
 *
 * ?slide= picks the image of the carousel: "cover" (default), "text-<n>",
 * "evidence-<n>", "end" (see src/social/slides.ts).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string; documentId: string }> }
) {
  const { locale, documentId } = await params;
  const slide = new URL(request.url).searchParams.get('slide') ?? 'cover';
  if (
    !LOCALES.includes(locale as Locale) ||
    !/^[a-z0-9]{10,40}$/.test(documentId) ||
    !/^(cover|text-\d{1,2}|evidence-\d{1,2}|end)$/.test(slide)
  ) {
    return new Response('Not found', { status: 404 });
  }

  const incident = await getIncidentByDocumentId(documentId, locale);
  const jpeg = incident ? await renderSlide(incident, locale, slide) : null;
  if (!jpeg) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(new Uint8Array(jpeg), {
    headers: {
      'Content-Type': 'image/jpeg',
      // Links carry ?v=<publishedAt>, so an edited fiche gets new URLs.
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
