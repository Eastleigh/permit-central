import type { User } from "./auth";
import { APP_URL, parseList } from "./config";
import { all, nowIso, run } from "./db";
import { emailLayout, esc, sendEmail } from "./email";
import { findPermits, formatDate, mapsLink, permitReasons, permitTrades, type Permit } from "./permits";
import { tradeLabel } from "./trades";

const MAX_IN_EMAIL = 40;

function permitHtml(p: Permit, myTrades: string[]) {
  const trades = permitTrades(p);
  const reasons = permitReasons(p);
  const why = [...new Set(trades.filter((t) => myTrades.includes(t)).map((t) => reasons[t]).filter(Boolean))] as string[];
  const desc = (p.description ?? "").slice(0, 180) + ((p.description ?? "").length > 180 ? "…" : "");
  const chips = trades
    .map((t) => `<span style="display:inline-block;background:#fff7ed;color:#c2410c;font-size:12px;font-weight:700;padding:3px 9px;border-radius:999px;margin:0 4px 4px 0">${esc(tradeLabel(t))}</span>`)
    .join("");
  return `<div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:12px">
<div style="font-size:13px;color:#6b7280">${esc(p.permit_class ?? p.category)} · ${formatDate(p.issue_date)}</div>
<a href="${esc(mapsLink(p))}" style="display:block;font-size:17px;font-weight:700;color:#0f2742;text-decoration:none;margin:4px 0 8px">${esc(p.address)} <span style="font-weight:400;color:#6b7280;font-size:14px">${esc(p.zip ?? "")}</span></a>
<div>${chips}</div>
${why.map((w) => `<div style="font-size:14px;color:#374151;background:#f9fafb;border-radius:8px;padding:6px 10px;margin:4px 0">Why: ${esc(w)}</div>`).join("")}
${desc ? `<div style="font-size:14px;margin:8px 0">${esc(desc)}</div>` : ""}
${p.contractor_name ? `<div style="font-size:13px;color:#6b7280">Builder: ${esc(p.contractor_name)}</div>` : ""}
${p.link ? `<a href="${esc(p.link)}" style="font-size:13px;color:#c2410c">City record</a>` : ""}
</div>`;
}

function digestEmail(user: User, permits: Permit[], total: number) {
  const myTrades = parseList(user.trades);
  const shown = permits.slice(0, MAX_IN_EMAIL);
  const subject = `${total} new permit${total === 1 ? "" : "s"} for ${myTrades.map(tradeLabel).join(", ").toLowerCase()}`;
  const more = total > shown.length
    ? `<p style="text-align:center"><a href="${APP_URL}/dashboard?days=1" style="color:#c2410c;font-weight:700">See all ${total} on your dashboard</a></p>`
    : "";
  const html = emailLayout(`<p style="font-size:16px;margin:0 0 16px">Good morning${user.business_name ? `, ${esc(user.business_name)}` : ""}. Here are the new permits in your ZIP codes:</p>
${shown.map((p) => permitHtml(p, myTrades)).join("")}${more}
<p style="text-align:center;margin-top:20px"><a href="${APP_URL}/dashboard" style="display:inline-block;background:#ea580c;color:#fff;font-weight:700;padding:12px 20px;border-radius:10px;text-decoration:none">Open dashboard</a></p>`);
  const text = `${subject}\n\n${shown.map((p) => `• ${p.address} ${p.zip ?? ""} — ${p.permit_class ?? p.category} (${formatDate(p.issue_date)})\n  ${(p.description ?? "").slice(0, 140)}`).join("\n")}\n\nDashboard: ${APP_URL}/dashboard`;
  return { to: user.email, subject, html, text };
}

/** Email every subscriber the permits that showed up since their last email. Users with no matches get no email. */
export async function sendDigests() {
  const startedAt = nowIso();
  const users = await all<User>(
    "SELECT * FROM users WHERE status IN ('active', 'trialing') AND email_enabled = 1 AND trades != '' AND zips != ''",
  );
  let sent = 0, skipped = 0, failed = 0;

  for (const user of users) {
    try {
      const { rows, total } = await findPermits({
        trades: parseList(user.trades),
        zips: parseList(user.zips),
        firstSeenAfter: user.last_digest_at ?? user.created_at,
        limit: MAX_IN_EMAIL,
      });
      if (total > 0) {
        await sendEmail(digestEmail(user, rows, total));
        sent++;
      } else {
        skipped++;
      }
      await run("UPDATE users SET last_digest_at = ? WHERE id = ?", [startedAt, user.id]);
    } catch (err) {
      failed++;
      console.error(`Digest failed for user ${user.id}:`, err);
    }
  }

  const summary = { subscribers: users.length, sent, skipped, failed };
  await run("INSERT INTO runs (kind, started_at, summary) VALUES ('digest', ?, ?)", [startedAt, JSON.stringify(summary)]);
  return summary;
}
