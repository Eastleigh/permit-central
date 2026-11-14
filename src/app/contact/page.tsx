import type { Metadata } from "next";
import Link from "next/link";
import { GUARANTEE_DAYS, SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_PHONE_TEL } from "@/lib/config";

export const metadata: Metadata = { title: "Contact — Permit Central" };

export default function Contact() {
  return (
    <article className="card legal">
      <h1>Contact us</h1>
      <p>Questions, a refund, a city you want us to cover, or anything else — call or email and a real person will answer.</p>
      <p className="contact-email"><a href={SUPPORT_PHONE_TEL}>{SUPPORT_PHONE}</a></p>
      <p className="contact-email"><a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>
      <ul>
        <li><b>Refunds:</b> within {GUARANTEE_DAYS} days of your first payment, just ask. See our <Link href="/terms#refunds">refund policy</Link>.</li>
        <li><b>Cancel:</b> anytime from Settings → Manage billing, no need to email.</li>
        <li><b>Already a subscriber?</b> You can also just reply to any of our emails.</li>
      </ul>
    </article>
  );
}
