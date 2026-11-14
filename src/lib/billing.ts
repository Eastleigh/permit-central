import Stripe from "stripe";
import { run } from "./db";

export const stripe = () => (process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null);

const STATUS: Record<Stripe.Subscription.Status, string> = {
  active: "active",
  trialing: "trialing",
  past_due: "past_due",
  unpaid: "past_due",
  canceled: "canceled",
  incomplete: "none",
  incomplete_expired: "canceled",
  paused: "canceled",
};

/**
 * The user's Stripe customer ID, or null if Stripe no longer knows it — e.g. a customer created in test mode
 * before switching to live keys. Stale links are cleared so the user can simply subscribe again.
 */
export async function liveCustomerId(s: Stripe, user: { id: number; stripe_customer_id: string | null }) {
  if (!user.stripe_customer_id) return null;
  try {
    const c = await s.customers.retrieve(user.stripe_customer_id);
    if (!c.deleted) return c.id;
  } catch (err) {
    if ((err as { code?: string }).code !== "resource_missing") throw err;
  }
  await run(
    "UPDATE users SET status = 'none', stripe_customer_id = NULL, stripe_subscription_id = NULL WHERE id = ?",
    [user.id],
  );
  return null;
}

/** Copy a Stripe subscription's state onto our user. Called from the webhook and after checkout. */
export async function syncSubscription(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const userId = Number(sub.metadata?.userId) || null;
  await run(
    `UPDATE users SET status = ?, stripe_customer_id = ?, stripe_subscription_id = ?
     WHERE id = ? OR stripe_customer_id = ?`,
    [STATUS[sub.status] ?? "none", customerId, sub.id, userId, customerId],
  );
}
