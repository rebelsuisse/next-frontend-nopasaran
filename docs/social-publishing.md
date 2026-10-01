# Social publishing

Automatic posting of new incidents on the site's social accounts: what the feature does, how it works and how it is configured.

## What it does

- **Accounts:** `fr-CH` incidents go to the French accounts, `de-CH` incidents to the German ones. Italian and English are not published.
- **Networks:** Bluesky and Instagram. Facebook is on hold and X stays manual (see [Decisions](#decisions)).
- **Recent incidents** (added less than 30 days after they happened) are posted one by one:
  - 30 minutes after they are (re)published in Strapi, to leave time for a last review (a Bluesky post can't be edited, and its preview card is a snapshot). With the 15-minute cron, a post goes out 30 to 45 minutes after publication;
  - between 07:00 and midnight, Swiss time;
  - at least 30 minutes apart, and at most 3 per day and per account. Anything over the limit waits for the next slot.
- **Historical incidents** (added more than 30 days after they happened) are grouped in a weekly digest, on Sunday from 18:00, 9 at most (an Instagram carousel holds 10 images: 9 covers and the closing image). The rest waits for the following week. A lone historical incident is posted like a normal post. The digest does not count towards the daily limit.
- Only incidents added after `SOCIAL_START_DATE` are posted, never the back catalogue.
- An incident is never posted twice on the same account, even when it is edited and republished.
- **Public wording:** "fiche(s)" (German "Eintrag/Einträge"), never "incident(s)".

### Bluesky posts

- **Individual post:** the title, then category and incident date, in the account's language. The link goes in a preview card: title, plain-text summary of the description, and the incident image, taken from Strapi's smaller copies so that it stays under Bluesky's 1 MB limit. Texts longer than 300 characters are shortened, keeping the category and date.
- **Weekly digest:** a thread: a header post, then one reply per incident, each answering the previous one.

### Instagram posts

- **New fiche: a carousel** of 1080×1350 JPEG images rendered by the site (the only format the Instagram API accepts):
  1. the cover, after the site's Story design: category and date, the title as large as it fits (never breaking a word), the subject's picture always at the same size and position, then "Name (party - canton)" and the role;
  2. the full text, formatted as on the fiche's page (subheadings, italics, bold, lists, quotes), on as few images as possible, cut between sentences;
  3. the evidence images, one per image;
  4. a closing image: logo, "À lire sur nopasaran.ch", and "Sources et liens dans chaque fiche, sur le site nopasaran.ch".

  Every image but the closing one carries a small nopasaran.ch signature, so that an image shared alone still says where it comes from. Large margins at the top and bottom, where Instagram lays its buttons.
- **Caption:** the title and the full text, no emoji, no link. Instagram cuts captions at 2,200 characters: a longer text is shortened with "…" (the images show all of it).
- **Weekly digest:** a carousel of the fiches' covers and the closing image; the caption lists the fiches and ends with "🔗 Lien en bio", the only emoji. Both accounts' bio links to the site.
- **Text layout.** The renderer (`next/og`) cannot measure text beforehand: the site wraps words itself with the advance widths of the Inter faces (`src/social/metrics.ts`, read from the font files), and the renderer lays them out word by word, so that lines break where the site expects. Fonts come from Google Fonts at render time, with one retry; if they still fail, the image fails rather than going out in the wrong font, and the post is retried on the next run.
- **Tokens.** Every run (dry-run or live, whether Instagram is enabled or not) renews each token once it is a week old; the status of both tokens is in the run report.

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
| State: what was posted, counters, log, Instagram tokens | `src/social/store.ts` (Upstash Redis) |
| Cron entry point | `GET /api/social/run`, every 15 minutes (`vercel.json`), up to 240 s per run |
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
- **Switching a network off or on:** change `SOCIAL_NETWORKS`, then redeploy. A network switched on only posts incidents added from then on.
- **New Instagram token** (e.g. after more than about 60 days without runs): generate it in the Meta app (Instagram API with Instagram Login → the account → "Générer un token"), put it in Vercel, redeploy. It replaces the stored one.

## Configuration

All variables are set in Vercel for the **Production** environment only, secrets as Sensitive.

| Variable | Value / purpose |
|---|---|
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` (+ other `KV_*`) | Upstash Redis, created by the Vercel Marketplace integration with prefix `KV` |
| `CRON_SECRET` | protects `/api/social/*` (except the image route) |
| `SOCIAL_MODE` | `live` |
| `SOCIAL_START_DATE` | `2026-09-30T00:00:00Z` |
| `SOCIAL_NETWORKS` | `bluesky,instagram` (default when unset: all three) |
| `BLUESKY_FR_APP_PASSWORD`, `BLUESKY_DE_APP_PASSWORD` | app passwords named `nopasaran-publisher` on `nopasaran-ch-fr.bsky.social` and `nopasaran-ch-de.bsky.social` (no DM access) |
| `INSTAGRAM_FR_TOKEN`, `INSTAGRAM_DE_TOKEN` | Instagram Login tokens of `nopasaran.ch_fr` and `nopasaran.ch_de` (60 days). The site copies them into Redis and renews them every week; a new value put in Vercel replaces the stored one |
| `FACEBOOK_DE_PAGE_ID`, `FACEBOOK_DE_PAGE_TOKEN` | German Facebook Page; not set (Facebook on hold) |

The code also accepts `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` instead of the `KV_*` names.

### Meta app

- `nopasaran publisher` (id 1404791037869529), use case "Instagram API with Instagram Login", in Development mode.
- `instagram_business_basic` and `instagram_business_content_publish` have Standard Access ("Prête pour le test"), which is enough for accounts with a role on the app: no App Review, no business portfolio.
- Both Instagram accounts are testers of the app.
- Privacy policy URL, needed to switch the app to Live: `https://www.nopasaran.ch/fr-CH/privacy`.

## Decisions

- **Instagram through Instagram Login, not through Facebook Pages.** The French Instagram account has no French Facebook Page to link to. With Instagram Login each professional account connects to the Meta app directly. Its tokens last 60 days, so the site stores them and renews them automatically. Meta's documentation says App Review is not required for an app that only serves accounts its owner manages.
- **Facebook is on hold.** The French Facebook account is a personal profile, not a Page, and Facebook's API cannot post on a profile. Creating a French Page is not wanted; only the German Page could be automated.
- **X is not automated.** Since February 2026 the X API is pay-per-use, at $0.20 per post containing a link. Posting on X stays manual.
- **State lives in Redis, not in Strapi.** With Draft & Publish, republishing an older draft could overwrite a "posted" field on the published version and cause duplicate posts.
- **Same repository as the site.** The pipeline reuses the Strapi client, the translations and the site's design (for the Instagram images), and runs as part of the same Vercel project (Pro plan, so cron can run every 15 minutes). It is isolated in `src/social/` and could be moved out as is.
- **Historical incidents go to a weekly digest**, so that backfilling old incidents doesn't flood the accounts.
- **Instagram posts carry the whole fiche.** A caption has no clickable link, so the text and the evidence are in the post itself, and the closing image points to the site for the sources and their links.

## Known limitations

- An incident created as a draft before `SOCIAL_START_DATE` and first published after it is never posted.
- **Stopped digest thread:** if a post fails in the middle of a Bluesky digest thread, the header and the first replies stay online and the remaining incidents go to next week's digest.
- **Rare duplicate:** if saving the post record fails right after a successful post, the next run posts the same incident again.
- **Instagram carousels hold 10 images.** A fiche with more text and evidence images than that loses its last evidence images.
- **Instagram tokens are only renewed while the pipeline runs.** With `SOCIAL_MODE=off` for more than about 60 days, they expire (see [Operating it](#operating-it)).
- **An Instagram post may not be public while the Meta app is in Development mode.** If posts are not visible to a logged-out visitor, the app must be switched to Live (privacy policy URL, category, icon).
