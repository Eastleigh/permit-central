# Go-live checklist

Work top to bottom. Each step says where to click and what to copy. **Paste keys straight into Vercel**, not into chat or email.

Total time: about 1–2 hours, mostly waiting for your domain's email settings to take effect.
Running cost: about $20–$35/month (Vercel Pro plus a domain). Everything else starts free.

---

## 1. Buy a domain (≈ $10–$15/year)

Done: you bought `getpermitcentral.com` at Namecheap. Having your own domain keeps your emails out of spam.
In Namecheap, **Domain List → Manage → Advanced DNS** is where you add records in steps 3 and 6.

## 2. Database: Turso (free)

1. Sign up at **turso.tech**.
2. Create a database named `permit-central`, in the region closest to Washington DC (Vercel's default region).
3. Copy the **Database URL** (starts with `libsql://`). It goes into `DATABASE_URL`.
4. Create a **token** for the database. It goes into `DATABASE_AUTH_TOKEN`.

The app creates its own tables on the first run, so you don't need to set anything else up.

## 3. Email: Resend (free up to 3,000 emails/month)

1. Sign up at **resend.com**.
2. **Domains → Add Domain** → enter your domain.
3. Resend shows 3–4 DNS records. Add each one at your domain provider, then click **Verify**. It can take a few minutes to a few hours.
4. **API Keys → Create API Key** (Sending access). It goes into `RESEND_API_KEY`.

## 4. Payments: Stripe

1. Sign up at **stripe.com**. Leave the **Test mode** switch ON for now.
2. **Developers → API keys** → copy the **Secret key** (`sk_test_...`). It goes into `STRIPE_SECRET_KEY`.
3. **Settings → Billing → Customer portal** → turn it on and allow customers to cancel and update payment methods. Save.

You don't need to create a product. The app charges $99/month with a 7-day free trial.

## 5. Hosting: Vercel

1. Sign up at **vercel.com**. Choose the **Pro plan ($20/month)**: the free Hobby plan isn't allowed for paid businesses.
2. In a terminal opened in the `permit-central` folder, run these one at a time:

```bash
npx vercel login
```

```bash
npx vercel link
```

   For `vercel link`, answer **Yes** to set up the project, pick your account, and name it `permit-central`.

3. In the Vercel dashboard, open the project → **Settings → Environment Variables**, and add each of these for **Production**:

| Name | Value |
|---|---|
| `DATABASE_URL` | `libsql://permit-central-jamrock.aws-us-east-2.turso.io` |
| `DATABASE_AUTH_TOKEN` | Turso token from step 2 |
| `RESEND_API_KEY` | from step 3 |
| `EMAIL_FROM` | `Permit Central <permits@getpermitcentral.com>` |
| `STRIPE_SECRET_KEY` | from step 4 |
| `STRIPE_WEBHOOK_SECRET` | leave out for now (step 7) |
| `PRICE_CENTS` | `9900` |
| `TRIAL_DAYS` | `7` |
| `CRON_SECRET` | the value in the file `.env.production.local` in this folder |
| `APP_URL` | `https://getpermitcentral.com` |

4. Deploy:

```bash
npx vercel --prod
```

## 6. Connect your domain

Vercel → project → **Settings → Domains** → add `getpermitcentral.com`. Vercel shows a DNS record or two. Add them at your domain provider. In a few minutes, your site loads at your domain with HTTPS.

## 7. Stripe webhook (keeps subscriptions in sync)

1. Stripe → **Developers → Webhooks → Add endpoint**.
2. Endpoint URL: `https://getpermitcentral.com/api/stripe/webhook`
3. Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`.
4. Copy the **Signing secret** (`whsec_...`) → add it in Vercel as `STRIPE_WEBHOOK_SECRET`.
5. Redeploy so it takes effect:

```bash
npx vercel --prod
```

## 8. Load the permits

Vercel → project → **Settings → Cron Jobs** → next to `/api/cron/daily`, click **Run**. The first run loads the last 60 days of Austin permits. After that it runs by itself every morning at 11:00 UTC.

## 9. Test it like a customer

1. Open your site on your phone. Enter `78745` and sign up with your own email.
2. Open the login email (check spam the first time) and tap the link.
3. Start the free trial with Stripe's test card: `4242 4242 4242 4242`, any future date, any CVC, any ZIP.
4. You should land on the dashboard with permits. In Stripe (test mode) you should see a new customer with a trialing subscription.
5. Settings → **Manage billing** should open Stripe's portal.
6. The next morning, check for your digest email.

## 10. Switch to real payments

1. In Stripe, complete **Activate account** (business details and bank account).
2. Turn **Test mode** off. Copy the live secret key (`sk_live_...`) → replace `STRIPE_SECRET_KEY` in Vercel.
3. Repeat step 7 in live mode (live webhooks are separate) → replace `STRIPE_WEBHOOK_SECRET`.
4. Redeploy:

```bash
npx vercel --prod
```

You're live. 🎉

---

### If something goes wrong

- **No login email:** check Resend → **Emails** for errors; usually the domain isn't verified yet.
- **"Stripe is not configured":** `STRIPE_SECRET_KEY` is missing, or you didn't redeploy after adding it.
- **No permits on the site:** run the cron job (step 8), then check Vercel → **Logs**.
- **Subscription stuck after paying:** check Stripe → Webhooks → your endpoint for failed deliveries.
