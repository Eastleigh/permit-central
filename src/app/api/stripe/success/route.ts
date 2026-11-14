import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe, syncSubscription } from "@/lib/billing";
import { APP_URL } from "@/lib/config";

// Stripe sends the customer here after checkout. We sync right away instead of waiting for the webhook,
// so the dashboard unlocks immediately.
export async function GET(req: NextRequest) {
  const s = stripe();
  const id = req.nextUrl.searchParams.get("session_id");
  if (s && id) {
    const session = await s.checkout.sessions.retrieve(id, { expand: ["subscription"] });
    if (session.subscription && typeof session.subscription !== "string") {
      await syncSubscription(session.subscription as Stripe.Subscription);
    }
  }
  return NextResponse.redirect(`${APP_URL}/dashboard?welcome=1`);
}
