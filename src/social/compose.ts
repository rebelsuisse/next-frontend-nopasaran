// src/social/compose.ts

import { getTranslations } from 'next-intl/server';
import { formatText, plainTextExcerpt } from '@/lib/format';
import { incidentImageUrl, incidentImageWithin } from '@/lib/media';
import { SITE_URL } from '@/lib/seo';
import type { Incident } from '@/types';
import { RULES, type SocialLocale } from './config';

const DAY_MS = 24 * 3600 * 1000;
// Largest image the networks accept as an upload (Bluesky: 1,000,000 bytes).
const THUMBNAIL_MAX_BYTES = 950_000;

// What a network needs to publish an incident, already localized.
export interface SocialItem {
  documentId: string;
  locale: SocialLocale;
  title: string;
  url: string;
  categoryLabel: string | null;
  incidentDateLabel: string;
  // Plain-text start of the description, for link previews.
  summary: string;
  imageUrl: string | null;
  // The same image, light enough to be uploaded to a network.
  thumbnail: { url: string; mime: string } | null;
  historical: boolean;
  createdAt: string;
  publishedAt: string;
}

// Added long after it happened: goes to the weekly digest.
export function isHistorical(incident: Incident): boolean {
  const addedAt = Date.parse(incident.createdAt);
  const happenedAt = Date.parse(incident.incident_date);
  return addedAt - happenedAt > RULES.historicalThresholdDays * DAY_MS;
}

export async function toSocialItems(
  incidents: Incident[],
  locale: SocialLocale
): Promise<SocialItem[]> {
  const tCats = await getTranslations({ locale, namespace: 'Categories' });

  return incidents.map(incident => ({
    documentId: incident.documentId,
    locale,
    title: formatText(incident.title),
    url: `${SITE_URL}/${locale}/the-wall-of-shame/${incident.slug}`,
    categoryLabel: incident.category
      ? tCats.has(incident.category) ? tCats(incident.category) : incident.category
      : null,
    incidentDateLabel: new Date(incident.incident_date).toLocaleDateString(locale, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }),
    summary: plainTextExcerpt(incident.description, 240),
    imageUrl: incidentImageUrl(incident),
    thumbnail: incidentImageWithin(incident, THUMBNAIL_MAX_BYTES),
    historical: isHistorical(incident),
    createdAt: incident.createdAt,
    publishedAt: incident.publishedAt,
  }));
}

/**
 * Generic texts. Each network adapts them to its own limits (length, links,
 * images) in its publisher; the dry run shows these versions.
 */
export function singlePostText(item: SocialItem): string {
  const details = [
    item.categoryLabel && `🏷️ ${item.categoryLabel}`,
    `📅 ${item.incidentDateLabel}`,
  ].filter(Boolean).join(' · ');

  return `${item.title}\n\n${details}\n\n${item.url}`;
}

export async function digestHeader(locale: SocialLocale, count: number): Promise<string> {
  const t = await getTranslations({ locale, namespace: 'Social' });
  return t('digestHeader', { count });
}

export function digestText(header: string, items: SocialItem[]): string {
  const lines = items.map(item => `• ${item.title} (${item.incidentDateLabel})\n${item.url}`);
  return `${header}\n\n${lines.join('\n\n')}`;
}
