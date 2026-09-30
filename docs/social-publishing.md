# Social publishing

Automatic posting of new incidents on the site's social accounts. This file records what the feature does, how it is configured and what has been done so far. Open steps are tracked in a separate working checklist; each step is recorded here once it is done.

## What it does

- **Accounts:** `fr-CH` incidents go to the French accounts, `de-CH` incidents to the German ones. Italian and English are not published for now.
- **Networks:** Bluesky, Facebook, Instagram. X stays manual (see [Decisions](#decisions)).
- **Recent incidents** (added less than 30 days after they happened) are posted one by one:
  - one hour after they are (re)published in Strapi, to leave time for a last review;
  - between 07:00 and midnight, Swiss time;
  - at least 30 minutes apart, and at most 3 per day and per account. Anything over the limit waits for the next slot.
- **Historical incidents** (added more than 30 days after they happened) are grouped in a weekly digest, on Sunday from 18:00, 10 at most. The rest waits for the following week. A lone historical incident is posted like a normal post. The digest does not count towards the daily limit.
- Only incidents added after `SOCIAL_START_DATE` are posted, never the back catalogue.
- An incident is never posted twice on the same account, even when it is edited and republished.

## How it works

| Part | Where |
|---|---|
| Rules (hours, limits, delays) | `src/social/config.ts` |
| Scheduler: what to post now, per account | `src/social/run.ts` |
| Swiss time, ISO weeks | `src/social/clock.ts` |
| Texts (individual post, digest) | `src/social/compose.ts`, translations under `Social` in `messages/*.json` |
| Network connectors | `src/social/publishers.ts`, `src/social/networks/` |
| State: what was posted, counters, log | `src/social/store.ts` (Upstash Redis) |
| Cron entry point | `GET /api/social/run`, every 15 minutes (`vercel.json`) |
| Status for humans | `GET /api/social/status` |
| Candidates from Strapi | `getSocialCandidates()` in `src/lib/api.ts` |

- **Modes** (`SOCIAL_MODE`):
  - `off` (default): nothing runs.
  - `dry-run`: the whole pipeline runs and records what it would have posted, without calling any network.
  - `live`: posts for real.

  Dry-run and live data are stored under separate Redis prefixes (`social:dry-run:*`, `social:live:*`).
- **Each run posts at most once per account.** A run that finds another run still in progress skips itself, to avoid duplicates.
- **Each account has its own start date:** its first run in a given mode. A network switched on later therefore only posts incidents added from then on, instead of catching up on everything since `SOCIAL_START_DATE`. The status route shows it as `startedAt`.
- **Dates:** Strapi keeps `createdAt` unchanged but updates `publishedAt` on every republish.
  - `createdAt` keeps the back catalogue out: a republished old incident is not new.
  - `publishedAt` gives the review delay, which restarts when a fix is republished.
  - `createdAt` versus `incident_date` decides whether an incident is historical.
- **Both routes require** `Authorization: Bearer <CRON_SECRET>`. Vercel Cron sends it automatically.

### Operating it

```bash
# State: mode, per-account counters, last 50 posts or simulated posts
curl -H "Authorization: Bearer <CRON_SECRET>" https://www.nopasaran.ch/api/social/status
# Add ?mode=dry-run or ?mode=live to read the other mode's data.
```

- **Emergency stop:** set `SOCIAL_MODE=off` in Vercel, then redeploy.
- **Going live:**
  1. Review the dry-run log.
  2. Set `SOCIAL_MODE=live` and `SOCIAL_NETWORKS` to the networks that are ready (e.g. `bluesky`).
  3. Redeploy.

  No need to move `SOCIAL_START_DATE`: each account's start date is its first live run, so incidents seen during the dry run are not posted afterwards.

## Configuration

All variables are set in Vercel for the **Production** environment only, secrets as Sensitive.

| Variable | Value / purpose | Status |
|---|---|---|
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` (+ other `KV_*`) | Upstash Redis, created by the Vercel Marketplace integration with prefix `KV` | set 2026-09-29 |
| `CRON_SECRET` | protects `/api/social/*` | set 2026-09-29 |
| `SOCIAL_MODE` | `dry-run` | set 2026-09-29 |
| `SOCIAL_START_DATE` | `2026-09-30T00:00:00Z` | set 2026-09-29 |
| `SOCIAL_NETWORKS` | optional subset (default: all three) | not set |
| `BLUESKY_FR_APP_PASSWORD`, `BLUESKY_DE_APP_PASSWORD` | app passwords named `nopasaran-publisher` on `nopasaran-ch-fr.bsky.social` and `nopasaran-ch-de.bsky.social` (no DM access) | set 2026-09-30 |
| `FACEBOOK_{FR,DE}_PAGE_ID`, `FACEBOOK_{FR,DE}_PAGE_TOKEN` | Facebook Page ids and non-expiring Page tokens (also used for Instagram) | planned (steps 3–4) |

The code also accepts `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` instead of the `KV_*` names.

## Progress log

### 2026-09-27 · RSS feeds

- A feed per locale at `/<locale>/feed.xml` (RSS 2.0, full text, image), announced in every page's `<head>`. All four validate with the W3C feed validator.
- A subscription page at `/<locale>/rss` (copy button, Feedly and Inoreader links), linked from the footer's RSS icon.
- Feedly only adds a feed it doesn't know yet for a signed-in user. Once one person has subscribed, it works for everyone.

### 2026-09-29 · Step 1, foundation (code)

- **Feed order.** The feed now lists incidents in the order they were added (`createdAt`), with the incident date in each item's body. Before, it was sorted by incident date, so historical incidents added recently never appeared: about half of the additions.
- **Publishing pipeline.** Scheduler, dry-run publisher, Redis state, the `run` and `status` routes, and the cron entry. `documentId` added to the `Incident` type, `SITE_URL` in `src/lib/seo.ts`, and the image helper moved to `src/lib/media.ts`.
- **Local test.** Tested against a local Redis behind an Upstash-compatible REST proxy, with real September incidents, by simulating a Sunday and the following Monday. Observed:
  - an individual post at 17:00, then the digest of the 5 historical incidents at 18:05;
  - posts held back by the 30-minute spacing, then by the 3-per-day limit;
  - nothing between midnight and 07:00;
  - the second of two simultaneous runs skipped itself;
  - `401` without the secret.

### 2026-09-29 · Step 1, Vercel setup: dry run started

- Upstash Redis added from the Vercel Marketplace (prefix `KV`, Production).
- `CRON_SECRET`, `SOCIAL_MODE=dry-run` and `SOCIAL_START_DATE=2026-09-30T00:00:00Z` set.
- `/api/social/status` answers in production with `"currentMode":"dry-run"` and an empty log: incidents count from 30 Sep 2026.

### 2026-09-30 · Step 2a, Bluesky app passwords

- An app password `nopasaran-publisher` (no DM access) created on each account and stored in Vercel as `BLUESKY_FR_APP_PASSWORD` / `BLUESKY_DE_APP_PASSWORD` (Production, Sensitive). Production redeployed.

### 2026-09-30 · Bluesky connector (code)

- `src/social/networks/bluesky.ts`, with the official `@atproto/api` client.
- **Individual post.** The title, then category and incident date, in the account's language. The link goes in a preview card: title, plain-text summary of the description, and the incident image, taken from Strapi's smaller copies so that it stays under Bluesky's 1 MB limit. Texts longer than 300 characters are shortened, keeping the category and date.
- **Weekly digest.** A thread: a header post, then one reply per incident, each answering the previous one. If a post fails, the thread stops there. The incidents already in it are recorded, and the others wait for next week's digest, so the header is never posted twice.
- **Dry run.** Bluesky entries in the log now show the exact Bluesky text.
- **Per-account start date** (see [How it works](#how-it-works)).
- **Local test,** without posting anything. A fake client checked every record against Bluesky's own schema (`app.bsky.feed.post`) and received a real image upload from Strapi (52 KB). Verified:
  - the thread chaining, and the stop after a failure;
  - the shortening of long texts;
  - a re-run of the scheduler simulation: Bluesky alone first, then Facebook and Instagram switched on a day later. Only incidents added after their switch-on were posted.

## Decisions

- **X is not automated.** Since February 2026 the X API is pay-per-use, at $0.20 per post containing a link. Posting on X stays manual.
- **State lives in Redis, not in Strapi.** With Draft & Publish, republishing an older draft could overwrite a "posted" field on the published version and cause duplicate posts.
- **Same repository as the site.** The pipeline reuses the Strapi client, the translations and the site's design (for the Instagram image), and runs as part of the same Vercel project (Pro plan, so cron can run every 15 minutes). It is isolated in `src/social/` and could be moved out as is.
- **Historical incidents go to a weekly digest**, so that backfilling old incidents doesn't flood the accounts.

## Known limitations

- An incident created as a draft before `SOCIAL_START_DATE` and first published after it is never posted.
- **Stopped digest thread:** if a post fails in the middle of a Bluesky digest thread, the header and the first replies stay online and the remaining incidents go to next week's digest.
- **Rare duplicate:** if saving the post record fails right after a successful post, the next run posts the same incident again.
