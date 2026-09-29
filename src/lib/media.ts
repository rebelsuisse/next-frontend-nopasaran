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
  if (!url) return null;
  return url.startsWith('http') ? url : `${STRAPI_HOST}${url}`;
}
