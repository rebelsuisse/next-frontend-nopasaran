// src/social/store.ts

import { Redis } from '@upstash/redis';
import type { Network, SocialLocale, SocialMode } from './config';

/**
 * Publishing state, in Upstash Redis.
 *
 * Kept out of Strapi on purpose: with Draft & Publish, an editor republishing
 * an older draft could overwrite a field written on the published version,
 * wipe the "already posted" marker and cause a duplicate post.
 *
 * Dry-run and live use separate key prefixes, so a dry run never marks an
 * incident as posted for real.
 */

export interface PostRecord {
  postedAt: string;
  kind: 'single' | 'digest';
  // Network-side id of the post, kept to be able to delete it later.
  ref: string;
  url?: string;
}

export interface LogEntry {
  at: string;
  network: Network;
  locale: SocialLocale;
  kind: 'single' | 'digest' | 'error';
  documentIds: string[];
  titles: string[];
  text?: string;
  url?: string;
  error?: string;
}

const LOG_SIZE = 200;

let client: Redis | null = null;

function redis(): Redis {
  if (!client) {
    // The Vercel Marketplace integration may use either naming.
    const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
    if (!url || !token) {
      throw new Error(
        'Upstash Redis is not configured (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN).'
      );
    }
    client = new Redis({ url, token });
  }
  return client;
}

// A network token the site keeps and renews itself (Instagram).
export interface StoredToken {
  token: string;
  refreshedAt: string;
  // Hash of the env value it came from: a new token put in Vercel replaces it.
  seed: string;
}

export interface TokenStore {
  get(name: string): Promise<StoredToken | null>;
  set(name: string, value: StoredToken): Promise<void>;
}

// Shared by dry-run and live: the token is the same in both modes.
export const tokenStore: TokenStore = {
  async get(name: string): Promise<StoredToken | null> {
    return redis().get<StoredToken>(`social:tokens:${name}`);
  },
  async set(name: string, value: StoredToken) {
    await redis().set(`social:tokens:${name}`, value);
  },
};

export type Store = ReturnType<typeof createStore>;

export function createStore(mode: Exclude<SocialMode, 'off'>) {
  const prefix = `social:${mode}`;
  const account = (network: Network, locale: SocialLocale) =>
    `${prefix}:${network}:${locale}`;

  return {
    /**
     * When this account started posting in this mode: set on its first run,
     * never changed afterwards. A network switched on later therefore only
     * posts incidents added from then on, instead of catching up on
     * everything since SOCIAL_START_DATE.
     */
    async initAccountStart(network: Network, locale: SocialLocale, now: Date): Promise<Date> {
      const key = `${account(network, locale)}:start`;
      await redis().set(key, now.toISOString(), { nx: true });
      return new Date((await redis().get<string>(key)) ?? now.toISOString());
    },

    async getAccountStart(network: Network, locale: SocialLocale): Promise<Date | null> {
      const value = await redis().get<string>(`${account(network, locale)}:start`);
      return value ? new Date(value) : null;
    },

    // Document ids already posted on this account.
    async getPostedIds(network: Network, locale: SocialLocale): Promise<Set<string>> {
      return new Set(await redis().hkeys(`${account(network, locale)}:posted`));
    },

    async countPosted(network: Network, locale: SocialLocale): Promise<number> {
      return redis().hlen(`${account(network, locale)}:posted`);
    },

    async getLastPostAt(network: Network, locale: SocialLocale): Promise<Date | null> {
      const value = await redis().get<string>(`${account(network, locale)}:last-post`);
      return value ? new Date(value) : null;
    },

    async getDailyCount(network: Network, locale: SocialLocale, date: string): Promise<number> {
      return (await redis().get<number>(`${account(network, locale)}:count:${date}`)) ?? 0;
    },

    async isDigestDone(network: Network, locale: SocialLocale, isoWeek: string): Promise<boolean> {
      return (await redis().exists(`${account(network, locale)}:digest:${isoWeek}`)) === 1;
    },

    async markDigestDone(network: Network, locale: SocialLocale, isoWeek: string) {
      // Two weeks is plenty: only the current week is ever checked.
      await redis().set(`${account(network, locale)}:digest:${isoWeek}`, new Date().toISOString(), {
        ex: 14 * 24 * 3600,
      });
    },

    /**
     * Records a successful post: marks the incidents as posted (each with the
     * id of the post that carries it), updates the spacing timestamp and, for
     * individual posts, the daily counter.
     */
    async recordPost(
      network: Network,
      locale: SocialLocale,
      posted: Record<string, PostRecord>,
      post: { postedAt: string; kind: PostRecord['kind'] },
      swissDate: string
    ) {
      const key = account(network, locale);
      const pipeline = redis().pipeline();
      if (Object.keys(posted).length > 0) {
        pipeline.hset(`${key}:posted`, posted);
      }
      pipeline.set(`${key}:last-post`, post.postedAt);
      if (post.kind === 'single') {
        pipeline.incr(`${key}:count:${swissDate}`);
        pipeline.expire(`${key}:count:${swissDate}`, 3 * 24 * 3600);
      }
      await pipeline.exec();
    },

    async appendLog(entry: LogEntry) {
      const pipeline = redis().pipeline();
      pipeline.lpush(`${prefix}:log`, entry);
      pipeline.ltrim(`${prefix}:log`, 0, LOG_SIZE - 1);
      await pipeline.exec();
    },

    async getLog(limit: number): Promise<LogEntry[]> {
      return redis().lrange<LogEntry>(`${prefix}:log`, 0, limit - 1);
    },

    // Prevents two overlapping runs from posting the same incident twice.
    async acquireLock(ttlSeconds: number): Promise<boolean> {
      const result = await redis().set(`${prefix}:lock`, new Date().toISOString(), {
        nx: true,
        ex: ttlSeconds,
      });
      return result === 'OK';
    },

    async releaseLock() {
      await redis().del(`${prefix}:lock`);
    },
  };
}
