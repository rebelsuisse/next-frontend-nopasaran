// src/social/config.ts

/**
 * Automatic publishing of new incidents on social networks.
 *
 * The rules below are editorial decisions agreed with the site owners. Change
 * them on purpose only: they decide how often the accounts post.
 */

// Languages with at least one account. English has none.
export const SOCIAL_LOCALES = ['fr-CH', 'de-CH', 'it-CH'] as const;
export type SocialLocale = (typeof SOCIAL_LOCALES)[number];

// X is left out on purpose: its API costs $0.20 per post containing a link.
export const NETWORKS = ['bluesky', 'facebook', 'instagram'] as const;
export type Network = (typeof NETWORKS)[number];

// Bluesky accounts. Their app passwords are secrets, kept in Vercel.
// No Italian account.
export const BLUESKY_ACCOUNTS: Partial<
  Record<SocialLocale, { handle: string; passwordEnv: string; lang: string }>
> = {
  'fr-CH': { handle: 'nopasaran-ch-fr.bsky.social', passwordEnv: 'BLUESKY_FR_APP_PASSWORD', lang: 'fr' },
  'de-CH': { handle: 'nopasaran-ch-de.bsky.social', passwordEnv: 'BLUESKY_DE_APP_PASSWORD', lang: 'de' },
};

// Instagram accounts (Instagram Login). The env variable holds the token
// generated in the Meta App Dashboard; the site then keeps and renews it.
export const INSTAGRAM_ACCOUNTS: Partial<
  Record<SocialLocale, { username: string; tokenEnv: string; linkInBio: string }>
> = {
  'fr-CH': { username: 'nopasaran.ch_fr', tokenEnv: 'INSTAGRAM_FR_TOKEN', linkInBio: '🔗 Lien en bio : nopasaran.ch' },
  'de-CH': { username: 'nopasaran.ch_de', tokenEnv: 'INSTAGRAM_DE_TOKEN', linkInBio: '🔗 Link in der Bio: nopasaran.ch' },
  'it-CH': { username: 'nopasaran.ch_it', tokenEnv: 'INSTAGRAM_IT_TOKEN', linkInBio: '🔗 Link in bio: nopasaran.ch' },
};

// Languages with an account on each network: the others are skipped there.
// Facebook has no publisher yet.
export const ACCOUNT_LOCALES: Record<Network, readonly SocialLocale[]> = {
  bluesky: SOCIAL_LOCALES.filter(locale => BLUESKY_ACCOUNTS[locale]),
  facebook: ['fr-CH', 'de-CH'],
  instagram: SOCIAL_LOCALES.filter(locale => INSTAGRAM_ACCOUNTS[locale]),
};

export function hasAccount(network: Network, locale: SocialLocale): boolean {
  return ACCOUNT_LOCALES[network].includes(locale);
}

// Env variable holding the secret an account needs to post for real, if any.
export function accountSecretEnv(network: Network, locale: SocialLocale): string | null {
  if (network === 'bluesky') return BLUESKY_ACCOUNTS[locale]?.passwordEnv ?? null;
  if (network === 'instagram') return INSTAGRAM_ACCOUNTS[locale]?.tokenEnv ?? null;
  return null;
}

// The account's settings; throws for a language without an account.
export function accountOf<T>(accounts: Partial<Record<SocialLocale, T>>, locale: SocialLocale): T {
  const account = accounts[locale];
  if (!account) throw new Error(`No account for ${locale}.`);
  return account;
}

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
  // An Instagram carousel holds 10 images: 9 fiches and the closing image.
  digestMaxItems: 9,
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
