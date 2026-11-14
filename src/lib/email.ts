import { Resend } from "resend";
import { APP_URL, SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_PHONE_TEL } from "./config";

interface Email {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(email: Email) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`\n[email → ${email.to}] ${email.subject}\n${email.text}\n`);
    return;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "Permit Central <onboarding@resend.dev>",
    replyTo: SUPPORT_EMAIL,
    ...email,
  });
  if (error) throw new Error(`Resend: ${error.message}`);
}

export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Shared shell for all emails: one column, big type, readable on a phone. */
export function emailLayout(body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f3f4f6;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111827">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6"><tr><td align="center" style="padding:16px 8px">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="padding:8px 4px 16px;font-size:20px;font-weight:800;color:#0f2742">Permit<span style="color:#ea580c">Central</span></td></tr>
<tr><td>${body}</td></tr>
<tr><td style="padding:24px 4px;font-size:12px;color:#6b7280">You're getting this because you subscribe to Permit Central.
<a href="${APP_URL}/settings" style="color:#6b7280">Change your trades, ZIPs or email settings</a>.
Questions? Just reply, call <a href="${SUPPORT_PHONE_TEL}" style="color:#ea580c;font-weight:700">${SUPPORT_PHONE}</a>, or write to <a href="mailto:${SUPPORT_EMAIL}" style="color:#6b7280">${SUPPORT_EMAIL}</a>.</td></tr>
</table></td></tr></table></body></html>`;
}

export function loginEmail(to: string, link: string): Email {
  return {
    to,
    subject: "Your Permit Central login link",
    text: `Tap to log in to Permit Central: ${link}\n\nThis link expires in 1 hour.`,
    html: emailLayout(`<div style="background:#fff;border-radius:12px;padding:24px">
<p style="font-size:16px;margin:0 0 20px">Tap the button to log in. The link expires in 1 hour.</p>
<a href="${esc(link)}" style="display:inline-block;background:#ea580c;color:#fff;font-weight:700;font-size:16px;padding:14px 22px;border-radius:10px;text-decoration:none">Log in to Permit Central</a>
</div>`),
  };
}
