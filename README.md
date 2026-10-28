# Aureum — points + flights

Award-flight search, valuation and concierge booking. Search cached award
space across Qantas, Velocity, KrisFlyer, Emirates, United and LifeMiles,
ranked by cents-per-point (AUD), with watchlist alerts and a human concierge
gated behind an Aureum Plus subscription.

## Stack

- **TanStack Start** (React 19, file-based routes in `src/routes`, server
  functions colocated in `src/lib/*/**.functions.ts`) on **Cloudflare Workers**
  (`wrangler.jsonc`)
- **Supabase** — auth, Postgres with RLS (migrations in `supabase/migrations`)
- **Stripe** — embedded checkout + billing portal via the Lovable connector
  gateway; subscription state synced by webhook into `public.subscriptions`
- **Tailwind v4** — noir & gold design system in `src/styles.css`
  (`--gold`, `--gold-soft`, `bg-noir`, `text-gold-gradient`)
- **AwardTool real-time API** — on-demand award crawler. Set `AWARDTOOL_API_KEY`
  to make it the primary live search provider; seats.aero remains an optional
  live fallback when AwardTool is not configured.

## Environment variables

Server-side (Lovable Cloud secrets / `wrangler secret put`):

| Variable                                                          | Purpose                                                                      |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_PROJECT_ID` | Supabase client (anon key — safe to expose)                                  |
| `SUPABASE_SERVICE_ROLE_KEY`                                       | Poller + Stripe webhook writes (bypasses RLS — server only)                  |
| `AWARDTOOL_API_KEY`                                               | AwardTool real-time crawler (preferred live provider)                        |
| `SEATS_AERO_API_KEY`                                              | seats.aero live availability (optional fallback provider)                    |
| `CRON_SECRET`                                                     | Bearer token the scheduled poller must present (rotate from Account → Admin) |
| `STRIPE_SANDBOX_API_KEY`, `STRIPE_LIVE_API_KEY`                   | Stripe via Lovable connector gateway                                         |
| `PAYMENTS_SANDBOX_WEBHOOK_SECRET`, `PAYMENTS_LIVE_WEBHOOK_SECRET` | Webhook signature verification                                               |
| `LOVABLE_API_KEY`                                                 | Lovable connector gateway auth (Stripe + Telegram)                           |
| `TELEGRAM_API_KEY`                                                | Telegram alerts via the Lovable connector                                    |
| `RESEND_API_KEY`                                                  | Email alerts + concierge notifications (channel hidden if unset)             |
| `ALERTS_FROM_EMAIL`                                               | Verified sender, e.g. `Aureum Alerts <alerts@yourdomain.com>`                |
| `CONCIERGE_INBOX_EMAIL`                                           | Inbox notified of new booking requests                                       |

Client-side (`VITE_*`, safe to expose, committed in `.env.development`):

| Variable                                                                         | Purpose                                                   |
| -------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` | Browser Supabase client                                   |
| `VITE_PAYMENTS_CLIENT_TOKEN`                                                     | Stripe publishable key (`pk_test_` ⇒ sandbox mode banner) |
| `VITE_SITE_URL`                                                                  | Deployed origin used to absolutize `og:image`             |

`.env` is gitignored — keep real secrets out of the repo.

## Watchlist poller (cron)

`POST /api/public/hooks/poll-watchlists` with `Authorization: Bearer <CRON_SECRET>`
scans active watchlists, scores results with the CPP engine, and alerts via the
watchlist's channel (Telegram / email / in-app history) with 24h dedup by
fingerprint. Schedule it every 15 minutes, e.g. with `pg_cron` + `pg_net`:

```sql
select cron.schedule(
  'aureum-poll-watchlists', '*/15 * * * *',
  $$ select net.http_post(
       url    := 'https://<your-domain>/api/public/hooks/poll-watchlists',
       headers:= jsonb_build_object('Authorization', 'Bearer ' || '<CRON_SECRET>')
     ) $$
);
```

Admins can rotate `CRON_SECRET` and inspect run history from the Account page.

## Development

```sh
bun install       # or npm install
bun run dev       # vite dev
bun run build     # regenerates routeTree.gen.ts, builds for Cloudflare
bun run lint
```

Apply database changes by adding a file under `supabase/migrations/` —
policies enforce per-user access and the free-tier limit (one active
watchlist without an active subscription), so keep RLS in mind when adding
tables.

## Free tier vs Aureum Plus

|                                     | Free                | Plus (A$12/mo · A$120/yr) |
| ----------------------------------- | ------------------- | ------------------------- |
| Award search + CPP grading          | ✓                   | ✓                         |
| Points portfolio & transfer planner | ✓                   | ✓                         |
| Active watchlists                   | 1 (enforced by RLS) | Unlimited                 |
| Telegram / email alerts             | ✓                   | ✓                         |
| Concierge ticketing (`/book`)       | —                   | ✓                         |
