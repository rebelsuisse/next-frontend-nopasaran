// src/social/run.ts

import { getSocialCandidates } from '@/lib/api';
import { isWithinPublishingHours, swissClock, type SwissClock } from './clock';
import { digestHeader, toSocialItems, type SocialItem } from './compose';
import {
  getEnabledNetworks,
  getMode,
  getStartDate,
  RULES,
  SOCIAL_LOCALES,
  type Network,
  type SocialLocale,
  type SocialMode,
} from './config';
import { getPublisher, type Publisher, type PublishResult } from './publishers';
import { createStore, type Store } from './store';

const MINUTE_MS = 60 * 1000;
// Longer than a run can last (maxDuration of the route), shorter than the
// interval between two cron runs.
const LOCK_TTL_SECONDS = 5 * 60;

export interface AccountReport {
  network: Network;
  locale: SocialLocale;
  outcome: 'posted' | 'waiting' | 'idle' | 'error';
  detail: string;
  titles?: string[];
}

export interface RunReport {
  mode: SocialMode;
  at: string;
  swissTime?: string;
  message?: string;
  accounts: AccountReport[];
}

/**
 * One publishing run, triggered every 15 minutes by Vercel Cron.
 *
 * Each account (network + locale) posts at most once per run:
 * - on Sunday evening, the weekly digest of historical incidents if it is due;
 * - otherwise the oldest recent incident not posted yet, if the publishing
 *   hours, the daily limit and the minimum spacing allow it.
 * Anything that cannot go out now simply waits for a later run.
 */
export async function runSocialPublishing(now = new Date()): Promise<RunReport> {
  const mode = getMode();
  const report: RunReport = { mode, at: now.toISOString(), accounts: [] };

  if (mode === 'off') {
    return { ...report, message: 'SOCIAL_MODE is off: nothing to do.' };
  }

  const startDate = getStartDate();
  if (!startDate) {
    throw new Error('SOCIAL_START_DATE is missing or invalid (expected an ISO date).');
  }

  const store = createStore(mode);
  if (!(await store.acquireLock(LOCK_TTL_SECONDS))) {
    return { ...report, message: 'Another run is still in progress: skipped.' };
  }

  try {
    const clock = swissClock(now);
    report.swissTime = `${clock.date} ${String(clock.hour).padStart(2, '0')}:${String(clock.minute).padStart(2, '0')}`;
    const publishedBefore = new Date(now.getTime() - RULES.reviewDelayMinutes * MINUTE_MS);

    for (const locale of SOCIAL_LOCALES) {
      const networks = getEnabledNetworks();

      let items: SocialItem[];
      try {
        const incidents = await getSocialCandidates(locale, startDate, publishedBefore);
        items = await toSocialItems(incidents, locale);
      } catch (error) {
        // Strapi unreachable: every account of this locale waits for the next run.
        for (const network of networks) {
          report.accounts.push({ network, locale, outcome: 'error', detail: errorMessage(error) });
        }
        continue;
      }

      for (const network of networks) {
        const publisher = getPublisher(network, locale, mode);
        if (!publisher) {
          report.accounts.push({
            network,
            locale,
            outcome: 'idle',
            detail: 'No live publisher for this network yet.',
          });
          continue;
        }
        report.accounts.push(
          await runAccount({ network, locale, items, publisher, store, clock, now })
        );
      }
    }

    return report;
  } finally {
    await store.releaseLock();
  }
}

interface AccountContext {
  network: Network;
  locale: SocialLocale;
  items: SocialItem[];
  publisher: Publisher;
  store: Store;
  clock: SwissClock;
  now: Date;
}

async function runAccount(ctx: AccountContext): Promise<AccountReport> {
  const { network, locale, items, publisher, store, clock, now } = ctx;
  const base = { network, locale };

  try {
    if (!isWithinPublishingHours(clock)) {
      return { ...base, outcome: 'waiting', detail: 'Outside publishing hours.' };
    }

    const postedIds = await store.getPostedIds(network, locale);
    const pending = items.filter(item => !postedIds.has(item.documentId));
    const lastPostAt = await store.getLastPostAt(network, locale);
    const spacingOk =
      !lastPostAt || now.getTime() - lastPostAt.getTime() >= RULES.minSpacingMinutes * MINUTE_MS;

    // Weekly digest of historical incidents.
    if (
      clock.weekday === RULES.digestWeekday &&
      clock.hour >= RULES.digestHour &&
      !(await store.isDigestDone(network, locale, clock.isoWeek))
    ) {
      const historical = pending
        .filter(item => item.historical)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .slice(0, RULES.digestMaxItems);

      if (historical.length === 0) {
        await store.markDigestDone(network, locale, clock.isoWeek);
      } else if (!spacingOk) {
        return { ...base, outcome: 'waiting', detail: 'Digest due, waiting for the minimum spacing.' };
      } else {
        // A digest of one would look odd: a lone historical incident is posted
        // like any other.
        const result =
          historical.length === 1
            ? await publisher.publishSingle(historical[0])
            : await publisher.publishDigest(await digestHeader(locale, historical.length), historical);
        await record(ctx, historical, result, 'digest');
        await store.markDigestDone(network, locale, clock.isoWeek);
        return {
          ...base,
          outcome: 'posted',
          detail: `Weekly digest (${historical.length} historical incident(s)).`,
          titles: historical.map(item => item.title),
        };
      }
    }

    const next = pending.find(item => !item.historical);
    if (!next) {
      const waitingHistorical = pending.filter(item => item.historical).length;
      return {
        ...base,
        outcome: 'idle',
        detail: waitingHistorical
          ? `Nothing recent to post; ${waitingHistorical} historical incident(s) wait for the digest.`
          : 'Nothing to post.',
      };
    }

    const postsToday = await store.getDailyCount(network, locale, clock.date);
    if (postsToday >= RULES.maxPostsPerDay) {
      return { ...base, outcome: 'waiting', detail: `Daily limit reached (${postsToday}).`, titles: [next.title] };
    }
    if (!spacingOk) {
      return { ...base, outcome: 'waiting', detail: 'Waiting for the minimum spacing.', titles: [next.title] };
    }

    const result = await publisher.publishSingle(next);
    await record(ctx, [next], result, 'single');
    return { ...base, outcome: 'posted', detail: 'Individual post.', titles: [next.title] };
  } catch (error) {
    // Nothing is recorded: the same post is retried on the next run.
    const message = errorMessage(error);
    await store
      .appendLog({
        at: now.toISOString(),
        network,
        locale,
        kind: 'error',
        documentIds: [],
        titles: [],
        error: message,
      })
      .catch(() => {});
    return { ...base, outcome: 'error', detail: message };
  }
}

async function record(
  ctx: AccountContext,
  items: SocialItem[],
  result: PublishResult,
  origin: 'single' | 'digest'
) {
  const { network, locale, store, clock, now } = ctx;
  const documentIds = items.map(item => item.documentId);
  // A digest of one is posted as an individual post but, coming from the
  // digest, it does not count towards the daily limit.
  const kind = origin === 'digest' ? 'digest' : 'single';

  await store.recordPost(
    network,
    locale,
    documentIds,
    { postedAt: now.toISOString(), kind, ref: result.ref, url: result.url },
    clock.date
  );
  await store.appendLog({
    at: now.toISOString(),
    network,
    locale,
    kind,
    documentIds,
    titles: items.map(item => item.title),
    text: result.text,
    url: result.url,
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
