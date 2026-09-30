// src/social/publishers.ts

import { digestText, singlePostText, type SocialItem } from './compose';
import type { Network, SocialLocale, SocialMode } from './config';
import { blueskyDigestTexts, blueskyPublisher, blueskySingleText } from './networks/bluesky';
import { instagramCaption, instagramDigestCaption, instagramPublisher } from './networks/instagram';

export interface PublishResult {
  // Network-side id of the post (for later deletion). For a digest thread,
  // the id of its first post.
  ref: string;
  url?: string;
  // Text actually posted, for the log.
  text: string;
  // Digest only: id of the post carrying each incident. When present, only
  // the incidents listed here are recorded as posted (a thread can stop
  // halfway); the others stay pending.
  refs?: Record<string, string>;
  // Set when the post went out only partly.
  error?: string;
}

export interface Publisher {
  publishSingle(item: SocialItem): Promise<PublishResult>;
  publishDigest(header: string, items: SocialItem[]): Promise<PublishResult>;
}

// Builds a publisher for one account (network + locale).
type PublisherFactory = (locale: SocialLocale) => Publisher;

// Real publishers, added network by network.
const LIVE_PUBLISHERS: Partial<Record<Network, PublisherFactory>> = {
  bluesky: locale => blueskyPublisher(locale),
  instagram: locale => instagramPublisher(locale),
};

// Texts shown by the dry run: the network's own format when it has one.
const DRY_RUN_TEXTS: Partial<
  Record<Network, { single: (item: SocialItem) => string; digest: (header: string, items: SocialItem[]) => string }>
> = {
  bluesky: {
    single: blueskySingleText,
    digest: (header, items) => blueskyDigestTexts(header, items).join('\n---\n'),
  },
  instagram: {
    single: instagramCaption,
    digest: instagramDigestCaption,
  },
};

// Records what would have been posted, without calling the network.
const dryRunPublisher =
  (network: Network): PublisherFactory =>
  locale => {
    const texts = DRY_RUN_TEXTS[network] ?? { single: singlePostText, digest: digestText };
    return {
      async publishSingle(item) {
        return { ref: `dry-run:${network}:${locale}:${item.documentId}`, text: texts.single(item) };
      },
      async publishDigest(header, items) {
        return { ref: `dry-run:${network}:${locale}:digest:${Date.now()}`, text: texts.digest(header, items) };
      },
    };
  };

// null when the network cannot post in this mode yet.
export function getPublisher(
  network: Network,
  locale: SocialLocale,
  mode: Exclude<SocialMode, 'off'>
): Publisher | null {
  const factory = mode === 'dry-run' ? dryRunPublisher(network) : LIVE_PUBLISHERS[network];
  return factory ? factory(locale) : null;
}
