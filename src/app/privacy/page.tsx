import type { Metadata } from "next";
import { SUPPORT_EMAIL } from "@/lib/config";

export const metadata: Metadata = { title: "Privacy Policy — Permit Central" };

const UPDATED = "October 29, 2026";

export default function Privacy() {
  const mail = <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>;
  return (
    <article className="card legal">
      <h1>Privacy Policy</h1>
      <p className="muted small">Last updated {UPDATED}</p>

      <p>This explains what information Permit Central collects about you, why, and what we do with it. We keep it short and we don't sell your data.</p>

      <h2>What we collect</h2>
      <ul>
        <li><b>Account details:</b> your email address, business name (if you give one), the trades you pick and your ZIP codes.</li>
        <li><b>Billing:</b> handled by Stripe. We never see or store your full card number; we keep only Stripe's customer and subscription IDs and your subscription status.</li>
        <li><b>Waitlist:</b> if you join a waitlist, your email and the ZIP code you entered.</li>
        <li><b>Basic technical logs:</b> our hosting provider records requests (such as IP address and time) to keep the site running and secure.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To run your account, send your daily permit email and login links, and show your dashboard.</li>
        <li>To bill your subscription and handle refunds.</li>
        <li>To tell you when we launch in a ZIP code you asked about.</li>
        <li>To answer your messages.</li>
      </ul>
      <p>We don't sell or rent your information, and we don't use advertising trackers.</p>

      <h2>Cookies</h2>
      <p>We use one essential cookie to keep you logged in. No analytics or advertising cookies.</p>

      <h2>Services we rely on</h2>
      <p>
        Your information is processed by the providers that run the service: Vercel (hosting), Turso (database), Resend
        (email delivery) and Stripe (payments). They may store data in the United States and elsewhere, and only use it
        to provide their services to us.
      </p>

      <h2>Permit records</h2>
      <p>
        The permits we show are public records published by city governments, which can include property addresses and
        the names of builders. We show them as published, for contractors to market their services.
      </p>

      <h2>How long we keep it</h2>
      <p>We keep your account information while you have an account. Billing records are kept as long as tax and accounting rules require.</p>

      <h2>Your choices</h2>
      <ul>
        <li>Turn off the daily email anytime in Settings.</li>
        <li>Ask us for a copy of your data, to correct it, or to delete your account by emailing {mail}.</li>
      </ul>

      <h2>Changes</h2>
      <p>If we change this policy in a meaningful way, we'll update the date above and email subscribers.</p>

      <h2>Contact</h2>
      <p>Privacy questions: {mail}</p>
    </article>
  );
}
