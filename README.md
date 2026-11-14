# Permit Central

Every morning, Permit Central pulls new residential building permits from city open data and tags each one with the trades likely to want the job next: fence, landscaping, pool, gutters and blinds. Contractors pick their trade and ZIP codes, pay $99/month, and get one email each morning with the new permits that match. A phone-friendly dashboard lets them browse and filter.

The first city is the **City of Austin, TX** ([Issued Construction Permits](https://data.austintexas.gov/d/3syk-w9eu), updated daily).

## Run it on your computer

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
```

```bash
cp .env.example .env.local
```

```bash
npm run ingest
```

```bash
npm run dev
```

Then open http://localhost:3000. Without Stripe and Resend keys, the app runs in **dev mode**: login emails print to the terminal (and the login link shows on screen), and the "Start free trial" button activates the account without payment.

Useful commands:

| Command | What it does |
|---|---|
| `npm run ingest` | Pull new permits from every city (the first run loads the last 60 days) |
| `npm run digest` | Send the morning emails |
| `npm run stats` | How many permits are tagged for each trade |
| `npm run retag` | Re-run tagging on all saved permits (after editing the rules) |

## Go live (about 1–2 hours)

You'll set up four free accounts and paste their keys into Vercel.

1. **Database: [Turso](https://turso.tech)** (free tier). Create a database and copy its URL (`libsql://...`) into `DATABASE_URL` and a token into `DATABASE_AUTH_TOKEN`.
2. **Email: [Resend](https://resend.com)** (free up to 3,000 emails a month). Add and verify your domain (Resend shows the DNS records to add), create an API key → `RESEND_API_KEY`, and set `EMAIL_FROM`, e.g. `Permit Central <permits@yourdomain.com>`.
3. **Payments: [Stripe](https://dashboard.stripe.com)**. Copy the secret key → `STRIPE_SECRET_KEY` (start with the *test* key). You don't need to create a product: the app charges `PRICE_CENTS` per month (default $99) with a `TRIAL_DAYS` free trial (default 7).
   - In Stripe, under **Settings → Billing → Customer portal**, turn on the portal so customers can update cards and cancel.
4. **Hosting: [Vercel](https://vercel.com)**. Push this folder to a GitHub repo, import it in Vercel, and add every variable from `.env.example` under **Settings → Environment Variables**. Set `APP_URL` to your live address and `CRON_SECRET` to a long random string.
5. **Stripe webhook.** In Stripe, under **Developers → Webhooks**, add the endpoint `https://YOUR-DOMAIN/api/stripe/webhook` with the events `customer.subscription.created`, `customer.subscription.updated` and `customer.subscription.deleted`. Copy its signing secret → `STRIPE_WEBHOOK_SECRET`.
6. **Load permits once.** Open `https://YOUR-DOMAIN/api/cron/daily` with the header `Authorization: Bearer YOUR_CRON_SECRET`, or run `npm run ingest` locally with the Turso values in `.env.local`.

After that, Vercel runs `/api/cron/daily` every 30 minutes from 12:00 to 17:30 UTC (`*/30 12-17 * * *` in `vercel.json`; needs Vercel Pro). Austin republishes its data around 7–8am Central, so each run checks for new permits and the first run that finds some emails each subscriber the permits that are new since their last email; later runs that day do nothing. Subscribers with no new matches get no email that day.

Test the whole flow with Stripe's test card `4242 4242 4242 4242`, then switch to live keys.

## Add a city

1. Copy `src/sources/austin.ts` to a new file, e.g. `src/sources/roundRock.ts`.
2. Change how it fetches and maps permits. Cities on Socrata (many are) can reuse `socrataQuery`. Others need their own fetch code, but they only have to return the same `NormalizedPermit` shape.
3. Add it to the list in `src/sources/index.ts`.

That's all. The new city's ZIP codes show up in signup automatically once permits are loaded, and the homepage ZIP checker starts saying "we cover it." ZIPs people enter that you don't cover yet go to the `waitlist` table, which shows you which cities to add next.

## How tagging works

The rules are in `src/lib/trades.ts`. Each permit gets a category from its city source (new home, addition, remodel, accessory such as pools and decks, teardown), and the rules add trades with a plain-English reason:

- **New home** → fence, landscaping, gutters, blinds
- **Pool** → pool (service), fence (barrier required by code), landscaping
- **Teardown** → fence, landscaping (a new home usually follows)
- **Addition** → gutters, blinds
- Keywords: fence, deck/patio/pergola, roof, windows, drainage, gutters

Contractors see the reason ("Why: Pools require a barrier fence by code") in the app and in the email. These are likely leads, not confirmed ones. Run `npm run retag` after you change the rules.

## Where things are

```
src/sources/        one file per city + the shared Socrata helper
src/lib/trades.ts   trade list and tagging rules
src/lib/ingest.ts   pulls and saves permits
src/lib/digest.ts   builds and sends the morning email
src/lib/auth.ts     email-link login and sessions (no passwords)
src/lib/billing.ts  Stripe helpers
src/app/            pages: home, signup, login, billing, dashboard, settings
src/app/api/        login link, Stripe checkout/portal/webhook, daily cron
```

## Money-back guarantee

The site promises a full refund to anyone who asks within 30 days of their **first** payment, no questions asked. Requests arrive at `support@getpermitcentral.com` (forwarded to your inbox by Namecheap). To honor one:

1. Stripe → **Customers** → search their email → open their latest **payment** → **Refund** → full amount.
2. On the same customer, **cancel the subscription** (immediately) so they aren't charged again.
3. Reply to confirm. Refunds take 5–10 business days to reach their card.

The length is set by `GUARANTEE_DAYS` in `src/lib/config.ts`, and the contact address by `SUPPORT_EMAIL` (env var, defaults to support@getpermitcentral.com).

## Known limits

- Only City of Austin permits. Suburbs (Round Rock, Georgetown, Cedar Park, Leander, Kyle, Buda) each need their own source file, and Texas homes built outside city limits often have no building permit at all.
- Login-link requests aren't rate-limited yet. Add a limit before you advertise widely.
- There's no admin page. Use the Turso dashboard to look at users, the waitlist and the `runs` log.
