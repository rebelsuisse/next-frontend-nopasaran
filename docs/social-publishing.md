# Social publishing

Automatic posting of new incidents on the site's social accounts. This file records what the feature does, how it is configured and what has been done so far. Open steps are tracked in a separate working checklist; each step is recorded here once it is done.

## What it does

- **Accounts:** `fr-CH` incidents go to the French accounts, `de-CH` incidents to the German ones. Italian and English are not published for now.
- **Networks:** Bluesky (live), Instagram (live since 1 Oct 2026, first post pending), Facebook (on hold). X stays manual (see [Decisions](#decisions)).
- **Recent incidents** (added less than 30 days after they happened) are posted one by one:
  - 30 minutes after they are (re)published in Strapi, to leave time for a last review (a Bluesky post can't be edited, and its preview card is a snapshot);
  - between 07:00 and midnight, Swiss time;
  - at least 30 minutes apart, and at most 3 per day and per account. Anything over the limit waits for the next slot.
- **Historical incidents** (added more than 30 days after they happened) are grouped in a weekly digest, on Sunday from 18:00, 9 at most (an Instagram carousel holds 10 images: 9 covers and the closing image). The rest waits for the following week. A lone historical incident is posted like a normal post. The digest does not count towards the daily limit.
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
| Instagram images: layout, rendering, formatted text, font widths | `src/social/slides.ts`, `src/social/card.tsx`, `src/social/richtext.ts`, `src/social/metrics.ts` |
| Instagram images, public (Instagram fetches them) | `GET /api/social/image/<locale>/<documentId>?slide=cover\|text-<n>\|evidence-<n>\|end` |
| Account check, posts nothing | `GET /api/social/check` |
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
- **The `run`, `status` and `check` routes require** `Authorization: Bearer <CRON_SECRET>`. Vercel Cron sends it automatically. The image route is public: it only renders public Strapi data.

### Operating it

```bash
# State: mode, per-account counters, last 50 posts or simulated posts
curl -H "Authorization: Bearer <CRON_SECRET>" https://www.nopasaran.ch/api/social/status
# Add ?mode=dry-run or ?mode=live to read the other mode's data.

# Check the accounts without posting: Bluesky logins, and on each Instagram
# account the carousel of the latest fiche prepared but not published
curl -H "Authorization: Bearer <CRON_SECRET>" https://www.nopasaran.ch/api/social/check
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
| `SOCIAL_MODE` | `live` (was `dry-run` from 2026-09-29) | set 2026-09-30 |
| `SOCIAL_START_DATE` | `2026-09-30T00:00:00Z` | set 2026-09-29 |
| `SOCIAL_NETWORKS` | `bluesky,instagram` (was `bluesky` from 2026-09-30; default when unset: all three) | set 2026-10-01 |
| `BLUESKY_FR_APP_PASSWORD`, `BLUESKY_DE_APP_PASSWORD` | app passwords named `nopasaran-publisher` on `nopasaran-ch-fr.bsky.social` and `nopasaran-ch-de.bsky.social` (no DM access) | set 2026-09-30 |
| `INSTAGRAM_FR_TOKEN`, `INSTAGRAM_DE_TOKEN` | Instagram Login tokens of `nopasaran.ch_fr` and `nopasaran.ch_de` (60 days). The site copies them into Redis and renews them every week; a new value put in Vercel replaces the stored one | set 2026-09-30 |
| `FACEBOOK_DE_PAGE_ID`, `FACEBOOK_DE_PAGE_TOKEN` | German Facebook Page | on hold |

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

### 2026-09-30 · Step 2b, Bluesky live (first post pending)

- Dry run checked on a real incident (Rickenbacher, fr and de). It was "posted" one hour after publication, with the new Bluesky text format.
- `SOCIAL_MODE=live` and `SOCIAL_NETWORKS=bluesky` set, production redeployed. Both Bluesky accounts started at 2026-09-30 16:30 UTC; incidents created before that, including Rickenbacher, are not posted.
- Still to check: the first real post, which is also the first real test of the Bluesky login and image upload.
- Review delay reduced from 60 to 30 minutes (`reviewDelayMinutes` in `src/social/config.ts`). With the 15-minute cron, a post now goes out 30 to 45 minutes after publication.

### 2026-10-01 · Step 3b, Instagram live (first post pending)

- The Instagram connector and the new closing image deployed; `/api/social/check` passed on both accounts (Bluesky login, Instagram carousel prepared without publishing).
- Bio link set on both Instagram accounts.
- `SOCIAL_NETWORKS=bluesky,instagram` set and production redeployed. Each Instagram account starts at its first live run: fiches created before are not posted.
- Still to check: the first real post on each account, and that it is public while the Meta app is in Development mode.

### 2026-10-01 · Step 2b, first Bluesky posts checked

- First real posts on both accounts on 1 Oct 2026 at 15:30 (Swiss time), for the fiche on Jean-Luc Addor ("soi-disant vaccin" / "sogenannten Impfstoff"): title, category and date, then the preview card with the image, the start of the text and the link to the site. This was also the first real test of the Bluesky login and image upload.

### 2026-09-30 · Instagram before Facebook

- **The French Facebook account is a personal profile,** not a Page, and Facebook's API cannot post on a profile. Creating a French Page is not wanted, so Facebook is put on hold (roadmap). Only the German Page could be automated.
- **Instagram moves up to step 3:** it has the largest audience and takes the most time to post by hand. Both accounts will use **Instagram Login**, which needs no Facebook Page.

### 2026-09-30 · Privacy policy page, Google Ads tag removed

- **Privacy page.** A short, deliberately generic privacy page at `/<locale>/privacy` in the four languages (`content/privacy/*.mdx`), listed in the sitemap. Meta requires its URL to switch the Instagram app to Live: `https://www.nopasaran.ch/fr-CH/privacy`.
- **Google Ads removed.** The Google Ads tag (unused) was removed from the layout, together with its CSP exceptions. The CSP now has `frame-ancestors 'none'`: the only exception was for Google Tag Assistant. The Search Console verification is unrelated and stays.

### 2026-09-30 · Step 3a, Instagram tokens

- Meta app `nopasaran publisher` (id 1404791037869529), use case "Instagram API with Instagram Login", in Development mode. `instagram_business_basic` and `instagram_business_content_publish` show "Prête pour le test" (Standard Access), which is enough for accounts with a role on the app: no App Review, no business portfolio.
- Both accounts added as Instagram testers and invitations accepted; a token generated for each and stored in Vercel as `INSTAGRAM_FR_TOKEN` / `INSTAGRAM_DE_TOKEN` (Production, Sensitive).

### 2026-09-30 · Instagram connector (code)

- **Post of a new fiche: a carousel** (1080×1350 JPEG images rendered by the site, the only format the Instagram API accepts):
  1. the cover, after the site's Story design: category and date, the title as large as it fits (never breaking a word), the subject's picture always at the same size and position, then "Name (party - canton)" and the role;
  2. the full text, formatted as on the fiche's page (subheadings, italics, bold, lists, quotes), over 1 to 5 images, cut between sentences;
  3. the evidence images, one per image;
  4. a closing image: logo, "À lire sur nopasaran.ch", and "Sources et liens dans chaque fiche, sur le site nopasaran.ch" (changed on 2026-10-01 from a red "Lien en bio" badge).

  Every image but the closing one carries a small nopasaran.ch signature, so that an image shared alone still says where it comes from. Large margins at the top and bottom, where Instagram lays its buttons.
- **Caption:** the title and the full text, no emoji, no link. Instagram cuts captions at 2,200 characters: a longer text is shortened with "…" (the images show all of it).
- **Weekly digest:** a carousel of the fiches' covers and the closing image; the caption lists the fiches and ends with "🔗 Lien en bio". Digest capped at 9 fiches, for every network.
- **Public wording:** "fiche(s)" (German "Eintrag/Einträge"), never "incident(s)", and no emoji except the link in bio. The digest header, shared with Bluesky, changed accordingly.
- **Text layout.** The renderer (`next/og`) cannot measure text beforehand: the site wraps words itself with the advance widths of the Inter faces (`src/social/metrics.ts`, read from the font files), and the renderer lays them out word by word, so that lines break where the site expects. Fonts come from Google Fonts at render time, with one retry; if they still fail, the image fails rather than going out in the wrong font, and the post is retried on the next run.
- **Tokens.** Every run (dry-run or live, whether Instagram is enabled or not) renews each token once it is a week old; the status of both tokens is in the run report.
- **Check route** `/api/social/check` (see [Operating it](#operating-it)).
- **Longer runs:** the `run` route may now last 240 s (was 60 s): Instagram fetches and processes each image of a carousel.
- **Local tests,** without posting anything:
  - a fake Instagram API: the order of the calls (images, carousel, publication, link), the wait while Instagram processes an image, an image in error (nothing published), a missing link (post kept), the check that never publishes, the digest;
  - token renewal against an in-memory store: seeding from Vercel, no renewal before a week, renewal with the current token, a new token in Vercel taking over, a failed renewal keeping the stored token, the token never in a report; one real renewal call with a fake token, rejected by Instagram with a clean error;
  - the 100 latest fiches in French and German: every carousel starts with the cover, ends with the closing image, has at most 10 images and a text image when the fiche has text; no caption reaches 2,200 characters;
  - a simulated week of dry run against a local Redis (Bluesky and Instagram, fr and de): the digest of the 6 historical fiches on Sunday at 18:30, then one fiche every 35 minutes up to the daily limit;
  - the image route under `next start` after a production build.

## Decisions

- **Instagram through Instagram Login, not through Facebook Pages.** The French Instagram account has no French Facebook Page to link to. With Instagram Login each professional account connects to the Meta app directly. Its tokens last 60 days, so the site stores them and renews them automatically. Meta's documentation says App Review is not required for an app that only serves accounts its owner manages.
- **X is not automated.** Since February 2026 the X API is pay-per-use, at $0.20 per post containing a link. Posting on X stays manual.
- **State lives in Redis, not in Strapi.** With Draft & Publish, republishing an older draft could overwrite a "posted" field on the published version and cause duplicate posts.
- **Same repository as the site.** The pipeline reuses the Strapi client, the translations and the site's design (for the Instagram image), and runs as part of the same Vercel project (Pro plan, so cron can run every 15 minutes). It is isolated in `src/social/` and could be moved out as is.
- **Historical incidents go to a weekly digest**, so that backfilling old incidents doesn't flood the accounts.
- **Instagram posts carry the whole fiche.** A caption has no clickable link, so the text and the evidence are in the post itself, and the closing image points to the site for the sources and their links.

## Known limitations

- An incident created as a draft before `SOCIAL_START_DATE` and first published after it is never posted.
- **Stopped digest thread:** if a post fails in the middle of a Bluesky digest thread, the header and the first replies stay online and the remaining incidents go to next week's digest.
- **Rare duplicate:** if saving the post record fails right after a successful post, the next run posts the same incident again.
- **Instagram carousels hold 10 images.** A fiche with more text and evidence images than that loses its last evidence images (one fiche in the 100 latest has 18).
- **Instagram tokens are only renewed while the pipeline runs.** With `SOCIAL_MODE=off` for more than about 60 days, they expire: generate new ones in the Meta app and put them in Vercel.
- **An Instagram post may not be public while the Meta app is in Development mode.** If the first post is not visible to a logged-out visitor, the app must be switched to Live (privacy policy URL, category, icon).
