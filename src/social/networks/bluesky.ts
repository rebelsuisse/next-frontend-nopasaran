// src/social/networks/bluesky.ts

import { AtpAgent, type AppBskyEmbedExternal, type AppBskyFeedPost } from '@atproto/api';
import type { SocialItem } from '../compose';
import { BLUESKY_ACCOUNTS, type SocialLocale } from '../config';
import type { Publisher } from '../publishers';

const SERVICE = 'https://bsky.social';
const MAX_GRAPHEMES = 300;
const MAX_BLOB_BYTES = 1_000_000;

type BlobRef = NonNullable<AppBskyEmbedExternal.External['thumb']>;
type PostRef = { uri: string; cid: string };

// What the publisher needs from a logged-in Bluesky session.
export interface BlueskyClient {
  post(record: AppBskyFeedPost.Record): Promise<PostRef>;
  uploadBlob(bytes: Uint8Array, encoding: string): Promise<BlobRef>;
}

// ---- Texts (also shown by the dry run) ----

export function blueskySingleText(item: SocialItem): string {
  const details = [
    item.categoryLabel && `🏷️ ${item.categoryLabel}`,
    `📅 ${item.incidentDateLabel}`,
  ].filter(Boolean).join(' · ');
  return fit(item.title, `\n\n${details}`);
}

export function blueskyDigestTexts(header: string, items: SocialItem[]): string[] {
  return [
    fit(header, ' 🧵'),
    ...items.map((item, index) =>
      fit(item.title, `\n\n📅 ${item.incidentDateLabel} · ${index + 1}/${items.length}`)
    ),
  ];
}

// Shortens `head` so that head + suffix fits in a post; the suffix is kept.
function fit(head: string, suffix: string): string {
  if (graphemes(head + suffix).length <= MAX_GRAPHEMES) return head + suffix;
  const budget = MAX_GRAPHEMES - graphemes(suffix).length - 1;
  return `${graphemes(head).slice(0, budget).join('').trimEnd()}…${suffix}`;
}

// Bluesky counts length in graphemes: an emoji or an accented letter is one.
function graphemes(text: string): string[] {
  return [...new Intl.Segmenter().segment(text)].map(part => part.segment);
}

// ---- Records ----

export function buildPostRecord(
  text: string,
  lang: string,
  item?: SocialItem,
  thumb?: BlobRef,
  reply?: AppBskyFeedPost.ReplyRef
): AppBskyFeedPost.Record {
  return {
    $type: 'app.bsky.feed.post',
    text,
    langs: [lang],
    createdAt: new Date().toISOString(),
    // The link goes in a preview card (title, summary, image) rather than in
    // the text: the whole card is clickable and the text stays short.
    ...(item && {
      embed: {
        $type: 'app.bsky.embed.external',
        external: {
          uri: item.url,
          title: item.title,
          description: item.summary,
          ...(thumb && { thumb }),
        },
      },
    }),
    ...(reply && { reply }),
  };
}

// ---- Publisher ----

async function login(locale: SocialLocale): Promise<BlueskyClient> {
  const account = BLUESKY_ACCOUNTS[locale];
  const password = process.env[account.passwordEnv];
  if (!password) throw new Error(`${account.passwordEnv} is not set.`);

  const agent = new AtpAgent({ service: SERVICE });
  await agent.login({ identifier: account.handle, password });

  return {
    post: record => agent.post(record),
    uploadBlob: async (bytes, encoding) => (await agent.uploadBlob(bytes, { encoding })).data.blob,
  };
}

export function blueskyPublisher(
  locale: SocialLocale,
  connect: (locale: SocialLocale) => Promise<BlueskyClient> = login
): Publisher {
  const { handle, lang } = BLUESKY_ACCOUNTS[locale];
  let client: Promise<BlueskyClient> | null = null;
  const session = () => (client ??= connect(locale));
  const postUrl = (uri: string) => `https://bsky.app/profile/${handle}/post/${uri.split('/').pop()}`;

  // A card without an image is better than no post: failures are ignored.
  async function thumbnail(bluesky: BlueskyClient, item: SocialItem): Promise<BlobRef | undefined> {
    if (!item.thumbnail) return undefined;
    try {
      const response = await fetch(item.thumbnail.url);
      if (!response.ok) return undefined;
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.byteLength > MAX_BLOB_BYTES) return undefined;
      return await bluesky.uploadBlob(bytes, response.headers.get('content-type') ?? item.thumbnail.mime);
    } catch {
      return undefined;
    }
  }

  return {
    async publishSingle(item) {
      const bluesky = await session();
      const text = blueskySingleText(item);
      const { uri } = await bluesky.post(buildPostRecord(text, lang, item, await thumbnail(bluesky, item)));
      return { ref: uri, url: postUrl(uri), text };
    },

    // A thread: the header, then one reply per incident, each answering the
    // previous one.
    async publishDigest(header, items) {
      const bluesky = await session();
      const [rootText, ...replyTexts] = blueskyDigestTexts(header, items);
      const root = await bluesky.post(buildPostRecord(rootText, lang));

      const refs: Record<string, string> = {};
      const posted = [rootText];
      let parent: PostRef = root;
      let error: string | undefined;

      for (const [index, item] of items.entries()) {
        try {
          const reply = await bluesky.post(
            buildPostRecord(replyTexts[index], lang, item, await thumbnail(bluesky, item), {
              root: { uri: root.uri, cid: root.cid },
              parent: { uri: parent.uri, cid: parent.cid },
            })
          );
          refs[item.documentId] = reply.uri;
          posted.push(replyTexts[index]);
          parent = reply;
        } catch (cause) {
          // Stop the thread rather than leave a gap in it. The incidents
          // already in the thread are recorded; the others wait for next
          // week's digest. Retrying now would post the header twice.
          error = `Thread stopped at ${index + 1}/${items.length}: ${
            cause instanceof Error ? cause.message : String(cause)
          }`;
          break;
        }
      }

      return { ref: root.uri, url: postUrl(root.uri), text: posted.join('\n---\n'), refs, error };
    },
  };
}
