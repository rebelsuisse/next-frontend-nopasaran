// src/app/[lang]/feed.xml/route.ts

import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getLatestAddedIncidents } from '@/lib/api';
import { formatText } from '@/lib/format';
import { renderMarkdown } from '@/lib/markdown';
import { incidentImageUrl } from '@/lib/media';
import { LOCALES, SITE_URL, type Locale } from '@/lib/seo';
import type { Incident } from '@/types';

const FEED_SIZE = 50;

// Un flux par langue : un slug d'incident n'existe que dans SA langue, un flux
// multilingue mélangerait des articles que le lecteur ne sait pas lire.
export const revalidate = 3600;

export function generateStaticParams() {
  return LOCALES.map(lang => ({ lang }));
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Une section CDATA se termine au premier « ]]> » : on coupe la séquence en
// deux sections pour qu'un contenu Strapi ne puisse pas casser le XML.
function cdata(value: string): string {
  return `<![CDATA[${value.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

function renderItem(
  incident: Incident,
  lang: string,
  categoryLabel: string | null,
  incidentDateLabel: string
): string {
  const link = `${SITE_URL}/${lang}/the-wall-of-shame/${incident.slug}`;
  // The feed lists what is new on the site, so items are dated when they were
  // added. The incident date goes in the body instead: many additions are
  // historical incidents.
  const pubDate = new Date(incident.createdAt).toUTCString();
  const imageUrl = incidentImageUrl(incident);

  // HTML inside CDATA: escape for HTML, not XML (&apos; is not HTML 4 and
  // some readers would show it literally).
  const safeDateLabel = incidentDateLabel
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  let contentHtml = `<p><em>${safeDateLabel}</em></p>`;
  // Même rendu que la page d'incident (src/lib/markdown.ts)
  contentHtml += renderMarkdown(formatText(incident.description));
  contentHtml += renderMarkdown(incident.consequence);

  return `
    <item>
      <title>${escapeXml(formatText(incident.title))}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pubDate}</pubDate>${
        categoryLabel ? `\n      <category>${escapeXml(categoryLabel)}</category>` : ''
      }
      <description>${cdata(contentHtml)}</description>${
        imageUrl ? `\n      <media:content url="${escapeXml(imageUrl)}" medium="image"/>` : ''
      }
    </item>`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lang: string }> }
) {
  const { lang } = await params;

  // Pas de resolveLocale ici : une langue inconnue doit donner 404, pas un
  // flux fr-CH servi sous une URL fantaisiste.
  if (!LOCALES.includes(lang as Locale)) notFound();

  const tMeta = await getTranslations({ locale: lang, namespace: 'Metadata' });
  const tCats = await getTranslations({ locale: lang, namespace: 'Categories' });
  // Même repli que la page d'incident : clé brute si la traduction manque.
  const categoryLabel = (category: string) =>
    category ? (tCats.has(category) ? tCats(category) : category) : null;
  const tFeed = await getTranslations({ locale: lang, namespace: 'Feed' });
  const incidentDateLabel = (incident: Incident) =>
    tFeed('incidentDate', {
      date: new Date(incident.incident_date).toLocaleDateString(lang, {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
    });
  const { data: incidents } = await getLatestAddedIncidents(lang, FEED_SIZE);

  const lastBuildDate = incidents.length > 0
    ? new Date(
        Math.max(...incidents.map(incident => new Date(incident.updatedAt).getTime()))
      ).toUTCString()
    : new Date().toUTCString();

  const feedUrl = `${SITE_URL}/${lang}/feed.xml`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>No pasarán - The Wall of Shame</title>
    <link>${SITE_URL}/${lang}</link>
    <description>${escapeXml(tMeta('siteDescription'))}</description>
    <language>${lang.toLowerCase()}</language>
    <copyright>CC BY-NC-SA 4.0 - Rebel Suisse</copyright>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE_URL}/icon.png</url>
      <title>No pasarán - The Wall of Shame</title>
      <link>${SITE_URL}/${lang}</link>
    </image>${incidents.map(incident =>
      renderItem(incident, lang, categoryLabel(incident.category), incidentDateLabel(incident))
    ).join('')}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
}
