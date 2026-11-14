import { redirect } from "next/navigation";
import { hasAccess, requireUser } from "@/lib/auth";
import { GUARANTEE_DAYS, PRICE_LABEL, TRIAL_DAYS, isDevMode, parseList } from "@/lib/config";
import { daysAgoDate, findPermits } from "@/lib/permits";
import { tradeLabel } from "@/lib/trades";

export default async function Billing() {
  const user = await requireUser();
  if (hasAccess(user)) redirect("/dashboard");

  const trades = parseList(user.trades);
  const zips = parseList(user.zips);
  const { total } = await findPermits({ trades, zips, issuedSince: daysAgoDate(30), limit: 0 });
  const trial = TRIAL_DAYS > 0 && user.status === "none";

  return (
    <div className="card">
      <h1>{user.status === "none" ? "One last step" : "Restart your subscription"}</h1>
      <p>
        In the last 30 days there were <b>{total} permits</b> for {trades.map(tradeLabel).join(", ").toLowerCase()} in your {zips.length} ZIP code{zips.length === 1 ? "" : "s"}.
      </p>
      <div className="price">{PRICE_LABEL}<span className="muted small"> / month</span></div>
      <p className="muted">{trial ? `Free for ${TRIAL_DAYS} days, then ${PRICE_LABEL}/month. ` : ""}Cancel anytime.</p>
      <form action="/api/stripe/checkout" method="post">
        <button className="btn" type="submit">{trial ? "Start free trial" : "Subscribe"}</button>
      </form>
      {user.status === "none" && (
        <p className="billing-guarantee">✓ {GUARANTEE_DAYS}-day money-back guarantee on your first payment. No questions asked.</p>
      )}
      {isDevMode && !process.env.STRIPE_SECRET_KEY && (
        <p className="muted small" style={{ marginTop: 12 }}>Dev mode: no Stripe key set, so this button activates the account without payment.</p>
      )}
    </div>
  );
}
