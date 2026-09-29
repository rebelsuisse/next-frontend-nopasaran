# No pasarán — The Wall of Shame (frontend)

Source of [nopasaran.ch](https://www.nopasaran.ch): a public record of far-right incidents in Switzerland, in French, German, Italian and English.

This repository is the website. The content (incidents, subjects, images) comes from a separate Strapi 5 backend through its public REST API.

## Stack

- [Next.js](https://nextjs.org) 16 (App Router), deployed on Vercel
- [next-intl](https://next-intl.dev) for the four locales (`fr-CH`, `de-CH`, `it-CH`, `en`); `fr-CH` is the default
- MDX for the static pages (`content/`), Tailwind CSS for styling
- An RSS feed per locale at `/<locale>/feed.xml`

## Local development

```bash
npm install
npm run dev        # http://localhost:3000
```

Create a `.env.local` (git-ignored) with the variables below.

`npm run build` prerenders the sitemap and the static pages, so **the Strapi API must be reachable at build time**. If `.env.local` points at a local Strapi that isn't running, the build fails on `/sitemap.xml`. Either start the local backend, or build against the public API:

```bash
NEXT_PUBLIC_STRAPI_URL=https://api.nopasaran.ch \
NEXT_PUBLIC_STRAPI_HOST=https://api.nopasaran.ch npm run build
```

## Configuration

In production these are set in the Vercel project settings (Environment Variables). Locally they go in `.env.local`. Never commit real values.

| Variable | Exposed to the browser | Purpose |
|---|---|---|
| `NEXT_PUBLIC_STRAPI_URL` | yes | Base URL of the Strapi API |
| `NEXT_PUBLIC_STRAPI_HOST` | yes | Host prefixed to Strapi image paths (`/uploads/...`) |
| `NEXT_PUBLIC_FORMSPREE_ID` | yes | Formspree form used by the contact page |
| `BREVO_API_KEY` | no — secret | Brevo API key used by the newsletter route |
| `BREVO_LIST_ID_FR` / `BREVO_LIST_ID_DE` | no | Brevo list IDs for newsletter sign-ups |
| `NEWSLETTER_ENABLED` | no | Feature flag, off by default — see below |
| `NEXT_PUBLIC_APP_VERSION` | yes | Set automatically by `npm run dev` / `npm run build` from `git describe` |
| `SOCIAL_MODE` | no | Social publishing: `off` (default), `dry-run` or `live` — see below |
| `SOCIAL_START_DATE` | no | ISO date; only incidents added from then on are published |
| `SOCIAL_NETWORKS` | no | Optional subset, e.g. `bluesky`; default: all |
| `CRON_SECRET` | no — secret | Protects `/api/social/*`; Vercel Cron sends it automatically |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | no — secret | Publishing state; set by the Upstash integration (`KV_REST_API_*` also accepted) |

### Newsletter flag

The newsletter page (`/<locale>/newsletter`) and its API route (`/api/newsletter`) both return 404 unless `NEWSLETTER_ENABLED=true`. Keep it off until the sign-up form has bot protection, per-IP rate limiting and double opt-in. The route talks to Brevo with a server-side key, so without those protections anyone could subscribe third-party addresses. See the comment at the top of `src/app/api/newsletter/route.ts`.

### Social publishing

New incidents are posted automatically on the `fr-CH` and `de-CH` social accounts (code in `src/social/`). Vercel Cron calls `/api/social/run` every 15 minutes (`vercel.json`); each run posts at most once per account. The rules live in `src/social/config.ts`:

- recent incidents are posted one by one, one hour after (re)publication in Strapi, between 07:00 and midnight Swiss time, at least 30 minutes apart, at most 3 per day and per account;
- historical incidents (added more than 30 days after they happened) are grouped in a weekly digest on Sunday from 18:00, 10 at most.

Rolling out:

1. Add Upstash Redis to the Vercel project (Marketplace) and set `CRON_SECRET`. Set secrets for the Production environment only.
2. `SOCIAL_MODE=dry-run` with `SOCIAL_START_DATE` set to today: runs the whole pipeline and records what it *would* post, without calling any network.
3. Review the simulated posts: `curl -H "Authorization: Bearer $CRON_SECRET" https://www.nopasaran.ch/api/social/status`.
4. Go live: `SOCIAL_MODE=live` and `SOCIAL_START_DATE` set to the go-live time, so that incidents seen during the dry run are not posted afterwards. Dry-run and live state are stored separately.

## Infrastructure

Hosting, DNS, access control and other operational settings are documented in the project's private documentation repository, not here.

## License

Code: [MPL-2.0](LICENSE). Published content: CC BY-NC-SA 4.0, Rebel Suisse.
