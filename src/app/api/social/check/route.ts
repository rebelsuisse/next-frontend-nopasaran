// src/app/api/social/check/route.ts

import { getLatestAddedIncidents } from '@/lib/api';
import { isAuthorized } from '@/social/auth';
import { toSocialItems } from '@/social/compose';
import { BLUESKY_ACCOUNTS, INSTAGRAM_ACCOUNTS, SOCIAL_LOCALES, type SocialLocale } from '@/social/config';
import { blueskyLogin } from '@/social/networks/bluesky';
import { instagramPublisher } from '@/social/networks/instagram';

/**
 * Checks the accounts without posting anything, to run after a deploy and
 * before enabling a network:
 * - Bluesky: logs in to each account;
 * - Instagram: prepares on each account the carousel of the latest fiche
 *   (token, permissions, every image fetched by Instagram from the live
 *   site) and stops before publishing. Instagram drops unpublished
 *   carousels after 24 hours.
 */
export const maxDuration = 240;

interface Check {
  network: 'bluesky' | 'instagram';
  locale: SocialLocale;
  ok: boolean;
  detail: string;
}

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

async function checkBluesky(locale: SocialLocale): Promise<Check> {
  const { handle } = BLUESKY_ACCOUNTS[locale];
  try {
    await blueskyLogin(locale);
    return { network: 'bluesky', locale, ok: true, detail: `Logged in as ${handle}.` };
  } catch (error) {
    return { network: 'bluesky', locale, ok: false, detail: `${handle}: ${errorMessage(error)}` };
  }
}

async function checkInstagram(locale: SocialLocale): Promise<Check> {
  const expected = INSTAGRAM_ACCOUNTS[locale].username;
  try {
    const [incident] = (await getLatestAddedIncidents(locale, 1)).data;
    if (!incident) throw new Error('No fiche to prepare a post with.');
    const [item] = await toSocialItems([incident], locale);

    const { username, containerId } = await instagramPublisher(locale).prepareOnly(item);
    if (username !== expected) {
      return {
        network: 'instagram',
        locale,
        ok: false,
        detail: `The token belongs to ${username}, not ${expected}: swapped tokens?`,
      };
    }
    return {
      network: 'instagram',
      locale,
      ok: true,
      detail: `${username}: carousel of ${item.slides.length} images prepared for "${item.title}" (container ${containerId}), not published.`,
    };
  } catch (error) {
    return { network: 'instagram', locale, ok: false, detail: `${expected}: ${errorMessage(error)}` };
  }
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const checks = await Promise.all(
    SOCIAL_LOCALES.flatMap(locale => [checkBluesky(locale), checkInstagram(locale)])
  );
  return Response.json({ ok: checks.every(check => check.ok), checks });
}
