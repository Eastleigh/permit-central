import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { liveCustomerId, stripe } from "@/lib/billing";
import { APP_URL, isDevMode, PRICE_CENTS, TRIAL_DAYS } from "@/lib/config";
import { run } from "@/lib/db";

export async function POST() {
  const user = await currentUser();
  if (!user) return NextResponse.redirect(`${APP_URL}/login`, 303);

  const s = stripe();
  if (!s) {
    if (!isDevMode) return new NextResponse("Stripe is not configured (STRIPE_SECRET_KEY).", { status: 500 });
    // Local development without Stripe keys: skip payment.
    await run("UPDATE users SET status = 'active' WHERE id = ?", [user.id]);
    return NextResponse.redirect(`${APP_URL}/dashboard?welcome=1`, 303);
  }

  const customer = await liveCustomerId(s, user);
  const status = customer ? user.status : "none"; // a cleared test-mode link means no real subscription yet
  const session = await s.checkout.sessions.create({
    mode: "subscription",
    ...(customer ? { customer } : { customer_email: user.email }),
    client_reference_id: String(user.id),
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: PRICE_CENTS,
        recurring: { interval: "month" },
        product_data: { name: "Permit Central — daily permit leads" },
      },
    }],
    subscription_data: {
      metadata: { userId: String(user.id) },
      ...(TRIAL_DAYS > 0 && status === "none" ? { trial_period_days: TRIAL_DAYS } : {}),
    },
    allow_promotion_codes: true,
    success_url: `${APP_URL}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/billing`,
  });
  return NextResponse.redirect(session.url!, 303);
}
