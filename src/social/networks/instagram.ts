// src/social/networks/instagram.ts

import { createHash } from 'node:crypto';
import { SITE_URL } from '@/lib/seo';
import type { SocialItem } from '../compose';
import { INSTAGRAM_ACCOUNTS, type SocialLocale } from '../config';
import type { Publisher } from '../publishers';
import { END_SLIDE } from '../slides';
import { tokenStore, type StoredToken, type TokenStore } from '../store';

/**
 * Instagram, through "Instagram API with Instagram Login": each professional
 * account is connected to the Meta app directly, no Facebook Page needed.
 *
 * Tokens last 60 days. The one generated in the App Dashboard goes into
 * Vercel; the site copies it into Redis and renews it every week (a token
 * can be renewed once it is 24 hours old, as long as it has not expired).
 */

const GRAPH = 'https://graph.instagram.com';
const VERSION = 'v24.0';
const REFRESH_AFTER_MS = 7 * 24 * 3600 * 1000;
const CAPTION_MAX = 2200;

type GraphParams = Record<string, string>;
export type GraphApi = (method: 'GET' | 'POST', path: string, params: GraphParams) => Promise<Record<string, unknown>>;

// ---- Captions (also shown by the dry run) ----

// Cuts a text at a word boundary so that it fits in `room` characters.
function fit(text: string, room: number): string {
  if (text.length <= room) return text;
  const cut = text.slice(0, Math.max(0, room - 1));
  const lastSpace = cut.search(/\s\S*$/);
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

// A fiche: its title and its full text. No category and date (they are on
// the cover) and no "link in bio": the whole fiche is in the post.
export function instagramCaption(item: SocialItem): string {
  const text = item.sections
    .map(section => [section.heading, section.paragraphs.join('\n\n')].filter(Boolean).join('\n'))
    .join('\n\n');
  // Only the text gives way if the caption is too long.
  return [item.title, fit(text, CAPTION_MAX - item.title.length - 2)].filter(Boolean).join('\n\n');
}

export function instagramDigestCaption(header: string, items: SocialItem[]): string {
  const lines = items.map((item, index) => `${index + 1}. ${item.title} (${item.incidentDateLabel})`);
  const linkInBio = items[0] ? INSTAGRAM_ACCOUNTS[items[0].locale].linkInBio : '';
  return fit(`${header}\n\n${lines.join('\n')}\n\n${linkInBio}`, CAPTION_MAX);
}

// Public URL of one image of the fiche, rendered by the site. The version
// parameter changes when the fiche is republished, so a fix is never hidden
// behind a cached image.
export function instagramImageUrl(item: SocialItem, slide = 'cover'): string {
  return `${SITE_URL}/api/social/image/${item.locale}/${item.documentId}?slide=${slide}&v=${Date.parse(item.publishedAt)}`;
}

// ---- Graph API ----

const graph: GraphApi = async (method, path, params) => {
  // The refresh endpoint is not versioned.
  const url = new URL(path.startsWith('/refresh_access_token') ? `${GRAPH}${path}` : `${GRAPH}/${VERSION}${path}`);
  const init: RequestInit = { method, cache: 'no-store' };
  if (method === 'GET') {
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  } else {
    init.body = new URLSearchParams(params);
  }

  const response = await fetch(url, init);
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown> & {
    error?: { message?: string };
  };
  if (!response.ok || data.error) {
    // The path holds ids only; the token is never part of the message.
    throw new Error(`Instagram ${method} ${path}: ${data.error?.message ?? `HTTP ${response.status}`}`);
  }
  return data;
};

// ---- Tokens ----

function seedOf(token: string): string {
  return createHash('sha256').update(token).digest('hex').slice(0, 16);
}

// The current token of an account: the renewed one from Redis, unless a new
// token was put in Vercel since.
async function currentToken(
  locale: SocialLocale,
  now = new Date(),
  store: TokenStore = tokenStore
): Promise<StoredToken> {
  const { tokenEnv } = INSTAGRAM_ACCOUNTS[locale];
  const fromEnv = process.env[tokenEnv];
  if (!fromEnv) throw new Error(`${tokenEnv} is not set.`);

  const stored = await store.get(`instagram:${locale}`);
  if (stored && stored.seed === seedOf(fromEnv)) return stored;

  const seeded = { token: fromEnv, refreshedAt: now.toISOString(), seed: seedOf(fromEnv) };
  await store.set(`instagram:${locale}`, seeded);
  return seeded;
}

export interface TokenStatus {
  locale: SocialLocale;
  outcome: 'ok' | 'renewed' | 'missing' | 'error';
  detail: string;
}

/**
 * Renews the account's token when it is a week old. Called on every run,
 * whether Instagram is enabled or not, so that the token never lapses.
 */
export async function maintainInstagramToken(
  locale: SocialLocale,
  now = new Date(),
  api: GraphApi = graph,
  store: TokenStore = tokenStore
): Promise<TokenStatus> {
  const { tokenEnv } = INSTAGRAM_ACCOUNTS[locale];
  if (!process.env[tokenEnv]) return { locale, outcome: 'missing', detail: `${tokenEnv} is not set.` };

  try {
    const stored = await currentToken(locale, now, store);
    const age = now.getTime() - Date.parse(stored.refreshedAt);
    if (age < REFRESH_AFTER_MS) {
      return { locale, outcome: 'ok', detail: `Renewed ${Math.floor(age / 86_400_000)} day(s) ago.` };
    }

    const renewed = await api('GET', '/refresh_access_token', {
      grant_type: 'ig_refresh_token',
      access_token: stored.token,
    });
    await store.set(`instagram:${locale}`, {
      token: String(renewed.access_token),
      refreshedAt: now.toISOString(),
      seed: stored.seed,
    });
    return { locale, outcome: 'renewed', detail: `Valid for ${Math.round(Number(renewed.expires_in) / 86_400)} days.` };
  } catch (error) {
    return { locale, outcome: 'error', detail: error instanceof Error ? error.message : String(error) };
  }
}

// ---- Publisher ----

export interface InstagramDeps {
  api: GraphApi;
  token: () => Promise<string>;
  sleep: (ms: number) => Promise<void>;
}

export function instagramPublisher(locale: SocialLocale, deps?: Partial<InstagramDeps>): Publisher & {
  prepareOnly(item: SocialItem): Promise<{ username: string; containerId: string }>;
} {
  const api = deps?.api ?? graph;
  const token = deps?.token ?? (async () => (await currentToken(locale)).token);
  const sleep = deps?.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)));

  let account: Promise<{ id: string; username: string }> | null = null;
  const me = async (accessToken: string) =>
    (account ??= api('GET', '/me', { fields: 'user_id,username', access_token: accessToken }).then(data => ({
      id: String(data.user_id),
      username: String(data.username),
    })));

  // Creates a media container and waits until Instagram has fetched and
  // processed the image. Nothing is visible until it is published.
  async function container(accessToken: string, params: GraphParams): Promise<string> {
    const { id } = await me(accessToken);
    const created = await api('POST', `/${id}/media`, { ...params, access_token: accessToken });
    const containerId = String(created.id);

    for (let attempt = 0; attempt < 20; attempt++) {
      const { status_code } = await api('GET', `/${containerId}`, { fields: 'status_code', access_token: accessToken });
      if (status_code === 'FINISHED') return containerId;
      if (status_code === 'ERROR' || status_code === 'EXPIRED') {
        throw new Error(`Instagram could not prepare the post (${status_code}).`);
      }
      await sleep(2000);
    }
    throw new Error('Instagram took too long to prepare the post.');
  }

  async function publish(accessToken: string, containerId: string) {
    const { id } = await me(accessToken);
    const published = await api('POST', `/${id}/media_publish`, { creation_id: containerId, access_token: accessToken });
    const mediaId = String(published.id);
    // The link is only for the log: a failure here must not fail the post.
    const permalink = await api('GET', `/${mediaId}`, { fields: 'permalink', access_token: accessToken })
      .then(data => String(data.permalink))
      .catch(() => undefined);
    return { mediaId, permalink };
  }

  // A carousel: its images first, then the carousel itself. Nothing is
  // visible until the carousel is published, in one go.
  async function carousel(accessToken: string, images: GraphParams[], caption: string): Promise<string> {
    const children: string[] = [];
    for (const image of images) {
      children.push(await container(accessToken, { ...image, is_carousel_item: 'true' }));
    }
    return container(accessToken, { media_type: 'CAROUSEL', children: children.join(','), caption });
  }

  // A fiche: its cover, text and evidence images and the closing image, as
  // a carousel.
  async function prepareSingle(accessToken: string, item: SocialItem) {
    const caption = instagramCaption(item);
    const images = item.slides.map(slide => ({
      image_url: instagramImageUrl(item, slide),
      ...(slide === 'cover' ? { alt_text: item.title } : {}),
    }));
    return { containerId: await carousel(accessToken, images, caption), caption };
  }

  return {
    async publishSingle(item) {
      const accessToken = await token();
      const { containerId, caption } = await prepareSingle(accessToken, item);
      const { mediaId, permalink } = await publish(accessToken, containerId);
      return { ref: mediaId, url: permalink, text: caption };
    },

    // The covers of the fiches and the closing image, as one carousel: it
    // goes out whole or not at all.
    async publishDigest(header, items) {
      const accessToken = await token();
      const caption = instagramDigestCaption(header, items);
      const images = [
        ...items.map(item => ({ image_url: instagramImageUrl(item), alt_text: item.title })),
        { image_url: instagramImageUrl(items[0], END_SLIDE) },
      ];
      const { mediaId, permalink } = await publish(accessToken, await carousel(accessToken, images, caption));
      return { ref: mediaId, url: permalink, text: caption };
    },

    // Check without posting: prepares a real post (token, permission, images
    // fetched by Instagram) and stops before publishing. Instagram drops
    // unpublished containers after 24 hours.
    async prepareOnly(item) {
      const accessToken = await token();
      const { containerId } = await prepareSingle(accessToken, item);
      return { username: (await me(accessToken)).username, containerId };
    },
  };
}
