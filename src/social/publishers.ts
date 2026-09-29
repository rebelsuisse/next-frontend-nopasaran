// src/social/publishers.ts

import { digestText, singlePostText, type SocialItem } from './compose';
import type { Network, SocialLocale, SocialMode } from './config';

export interface PublishResult {
  // Network-side id of the post (for later deletion).
  ref: string;
  url?: string;
  // Text actually posted, for the log.
  text: string;
}

export interface Publisher {
  publishSingle(item: SocialItem): Promise<PublishResult>;
  publishDigest(header: string, items: SocialItem[]): Promise<PublishResult>;
}

// Builds a publisher for one account (network + locale).
type PublisherFactory = (locale: SocialLocale) => Publisher;

// Real publishers, added network by network in the next steps.
const LIVE_PUBLISHERS: Partial<Record<Network, PublisherFactory>> = {};

// Records what would have been posted, without calling the network.
const dryRunPublisher =
  (network: Network): PublisherFactory =>
  locale => ({
    async publishSingle(item) {
      return { ref: `dry-run:${network}:${locale}:${item.documentId}`, text: singlePostText(item) };
    },
    async publishDigest(header, items) {
      return { ref: `dry-run:${network}:${locale}:digest:${Date.now()}`, text: digestText(header, items) };
    },
  });

// null when the network cannot post in this mode yet.
export function getPublisher(
  network: Network,
  locale: SocialLocale,
  mode: Exclude<SocialMode, 'off'>
): Publisher | null {
  const factory = mode === 'dry-run' ? dryRunPublisher(network) : LIVE_PUBLISHERS[network];
  return factory ? factory(locale) : null;
}
