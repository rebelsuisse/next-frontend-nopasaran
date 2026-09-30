// src/app/api/social/status/route.ts

import { isAuthorized } from '@/social/auth';
import { swissClock } from '@/social/clock';
import {
  getEnabledNetworks,
  getMode,
  getStartDate,
  RULES,
  SOCIAL_LOCALES,
} from '@/social/config';
import { createStore } from '@/social/store';

/**
 * State of the publishing pipeline, to review a dry run: per-account counters
 * and the latest posts (or simulated posts).
 *
 * ?mode=dry-run|live picks the namespace to read; by default the current mode,
 * or dry-run when publishing is off.
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const currentMode = getMode();
  const requested = new URL(request.url).searchParams.get('mode');
  const mode =
    requested === 'dry-run' || requested === 'live'
      ? requested
      : currentMode === 'off' ? 'dry-run' : currentMode;

  const now = new Date();
  const clock = swissClock(now);

  try {
    const store = createStore(mode);
    const accounts = await Promise.all(
      SOCIAL_LOCALES.flatMap(locale =>
        getEnabledNetworks().map(async network => ({
          network,
          locale,
          postedTotal: await store.countPosted(network, locale),
          postedToday: await store.getDailyCount(network, locale, clock.date),
          // First run of this account in this mode: incidents added before are skipped.
          startedAt: (await store.getAccountStart(network, locale))?.toISOString() ?? null,
          lastPostAt: (await store.getLastPostAt(network, locale))?.toISOString() ?? null,
          digestDoneThisWeek: await store.isDigestDone(network, locale, clock.isoWeek),
        }))
      )
    );

    return Response.json({
      currentMode,
      showing: mode,
      startDate: getStartDate()?.toISOString() ?? null,
      swissTime: `${clock.date} ${String(clock.hour).padStart(2, '0')}:${String(clock.minute).padStart(2, '0')} (${clock.isoWeek})`,
      rules: RULES,
      accounts,
      log: await store.getLog(50),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ currentMode, error: message }, { status: 500 });
  }
}
