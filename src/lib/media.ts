// src/lib/media.ts

import type { Incident } from '@/types';

const STRAPI_HOST = process.env.NEXT_PUBLIC_STRAPI_HOST || 'https://api.nopasaran.ch';

/**
 * Absolute URL of the image that best illustrates an incident: the first
 * evidence image, else the subject's picture. Strapi returns relative paths
 * (/uploads/...) for local uploads.
 */
export function incidentImageUrl(incident: Incident): string | null {
  const url = incident.evidence_image?.[0]?.url ?? incident.sujet?.picture?.url;
  return url ? absoluteUrl(url) : null;
}

/**
 * The same image, in the largest version that weighs at most `maxBytes`:
 * the original if small enough, else one of the copies Strapi resizes on
 * upload. Null when there is no image or every version is too heavy.
 */
export function incidentImageWithin(
  incident: Incident,
  maxBytes: number
): { url: string; mime: string } | null {
  const media = incident.evidence_image?.[0] ?? incident.sujet?.picture;
  if (!media) return null;

  const candidates = [
    { url: media.url, size: media.size, mime: media.mime },
    ...['large', 'medium', 'small'].map(name => media.formats?.[name]),
  ];
  const fitting = candidates.find(
    candidate => candidate?.url && candidate.size !== undefined && candidate.size * 1000 <= maxBytes
  );
  if (!fitting) return null;

  return { url: absoluteUrl(fitting.url), mime: fitting.mime ?? media.mime ?? 'image/jpeg' };
}

function absoluteUrl(url: string): string {
  return url.startsWith('http') ? url : `${STRAPI_HOST}${url}`;
}
