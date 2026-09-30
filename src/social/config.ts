// src/social/config.ts

/**
 * Automatic publishing of new incidents on social networks.
 *
 * The rules below are editorial decisions agreed with the site owners. Change
 * them on purpose only: they decide how often the accounts post.
 */

// Italian and English have no accounts of their own yet.
export const SOCIAL_LOCALES = ['fr-CH', 'de-CH'] as const;
export type SocialLocale = (typeof SOCIAL_LOCALES)[number];

// X is left out on purpose: its API costs $0.20 per post containing a link.
export const NETWORKS = ['bluesky', 'facebook', 'instagram'] as const;
export type Network = (typeof NETWORKS)[number];

// Bluesky accounts. Their app passwords are secrets, kept in Vercel.
export const BLUESKY_ACCOUNTS: Record<
  SocialLocale,
  { handle: string; passwordEnv: string; lang: string }
> = {
  'fr-CH': { handle: 'nopasaran-ch-fr.bsky.social', passwordEnv: 'BLUESKY_FR_APP_PASSWORD', lang: 'fr' },
  'de-CH': { handle: 'nopasaran-ch-de.bsky.social', passwordEnv: 'BLUESKY_DE_APP_PASSWORD', lang: 'de' },
};

export const RULES = {
  timeZone: 'Europe/Zurich',
  // Posts only go out between these hours, Swiss time (24 = midnight).
  windowStartHour: 7,
  windowEndHour: 24,
  // Minimum gap between two posts on the same account, digest included.
  minSpacingMinutes: 30,
  // Individual posts per account and per Swiss calendar day. The weekly
  // digest does not count towards it.
  maxPostsPerDay: 3,
  // Time to fix mistakes after an incident is (re)published in Strapi.
  reviewDelayMinutes: 30,
  // An incident added more than this many days after it happened is
  // "historical": it waits for the weekly digest instead of being posted alone.
  historicalThresholdDays: 30,
  // Weekly digest of historical incidents: Sunday (0) from 18:00.
  digestWeekday: 0,
  digestHour: 18,
  digestMaxItems: 10,
} as const;

/**
 * - off: nothing runs (default).
 * - dry-run: the whole pipeline runs and records what it would have posted,
 *   in its own storage namespace, without calling any network.
 * - live: posts for real.
 */
export type SocialMode = 'off' | 'dry-run' | 'live';

export function getMode(): SocialMode {
  const mode = process.env.SOCIAL_MODE;
  return mode === 'dry-run' || mode === 'live' ? mode : 'off';
}

/**
 * Only incidents added on or after this date are published, so that turning
 * the feature on does not post the whole back catalogue. Set it to the
 * go-live date when switching from dry-run to live, so that incidents
 * simulated during the dry run are not posted afterwards.
 */
export function getStartDate(): Date | null {
  const value = process.env.SOCIAL_START_DATE;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Optional comma-separated subset, e.g. SOCIAL_NETWORKS=bluesky. Default: all.
export function getEnabledNetworks(): Network[] {
  const value = process.env.SOCIAL_NETWORKS;
  if (!value) return [...NETWORKS];
  const requested = value.split(',').map(name => name.trim());
  return NETWORKS.filter(network => requested.includes(network));
}
