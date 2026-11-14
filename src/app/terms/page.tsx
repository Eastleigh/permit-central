import type { Metadata } from "next";
import Link from "next/link";
import { GUARANTEE_DAYS, PRICE_LABEL, SUPPORT_EMAIL, TRIAL_DAYS } from "@/lib/config";

export const metadata: Metadata = { title: "Terms of Service — Permit Central" };

const UPDATED = "October 29, 2026";

export default function Terms() {
  const mail = <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>;
  return (
    <article className="card legal">
      <h1>Terms of Service</h1>
      <p className="muted small">Last updated {UPDATED}</p>

      <p>
        These terms cover your use of Permit Central (“we”, “us”) at getpermitcentral.com. By creating an account or
        subscribing, you agree to them. If you don't agree, please don't use the service.
      </p>

      <h2>What we provide</h2>
      <p>
        Permit Central collects residential building permits published by city governments, tags each permit with the
        trades likely to be interested in it, and sends subscribers a daily email and an online dashboard of permits in
        the ZIP codes they choose.
      </p>

      <h2>Subscriptions and billing</h2>
      <ul>
        <li>The subscription costs {PRICE_LABEL} per month (USD), billed in advance by our payment processor, Stripe.</li>
        {TRIAL_DAYS > 0 && (
          <li>
            New subscribers get a {TRIAL_DAYS}-day free trial. Unless you cancel before the trial ends, your card is charged
            {" "}{PRICE_LABEL} at the end of the trial and every month after that.
          </li>
        )}
        <li>Your subscription renews automatically each month until you cancel.</li>
        <li>We may change the price with at least 30 days' notice by email. The new price applies from your next billing date after the notice period.</li>
      </ul>

      <h2>Cancelling</h2>
      <p>
        You can cancel anytime from <b>Settings → Manage billing</b>. Your access continues until the end of the period
        you've already paid for, and you won't be charged again. There are no cancellation fees.
      </p>

      <h2 id="refunds">Refund policy and {GUARANTEE_DAYS}-day money-back guarantee</h2>
      <p>
        If you're not happy with Permit Central, email {mail} within {GUARANTEE_DAYS} days of your <b>first</b> payment
        and we'll refund that payment in full. No questions asked. We'll also cancel your subscription so you aren't
        charged again. Refunds usually reach your card within 5–10 business days.
      </p>
      <p>
        After those {GUARANTEE_DAYS} days, payments are non-refundable, but you can cancel anytime to stop future charges.
      </p>

      <h2>About the permit data</h2>
      <ul>
        <li>
          Permits come from public government records. We don't control those records, and they can be late, incomplete
          or wrong. We pass them on as published.
        </li>
        <li>
          Trade tags and “why” notes are our best estimate of who might want the work. They are not a promise that a
          homeowner needs, or will buy, any product or service.
        </li>
        <li>Permits are public, so other businesses can see the same information. Leads are not exclusive.</li>
        <li>We don't guarantee any number of permits, jobs or revenue.</li>
      </ul>

      <h2>How you may use the data</h2>
      <ul>
        <li>Use it to market your own business's services.</li>
        <li>Don't resell, republish or share the data or your account with others.</li>
        <li>
          When you contact property owners, follow all laws that apply to you — including do-not-call, anti-spam,
          no-soliciting and door-to-door rules — and respect anyone who asks not to be contacted.
        </li>
      </ul>

      <h2>Your account</h2>
      <p>
        You log in with links sent to your email, so keep your email account secure. We may suspend accounts that break
        these terms, for example by reselling data.
      </p>

      <h2>Limits on our liability</h2>
      <p>
        The service is provided “as is”. To the extent the law allows, we aren't liable for indirect or consequential
        losses, such as lost profits or lost jobs, and our total liability to you is limited to the amount you paid us
        in the 12 months before the claim.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        We may update these terms. If a change is significant, we'll email subscribers before it takes effect. Continuing
        to use the service after that means you accept the updated terms.
      </p>

      <h2>Contact</h2>
      <p>Questions about these terms? Email {mail}, or see our <Link href="/privacy">privacy policy</Link>.</p>
    </article>
  );
}
