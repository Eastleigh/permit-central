import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe, syncSubscription } from "@/lib/billing";

// In the Stripe dashboard, point a webhook at /api/stripe/webhook with these events:
// customer.subscription.created, customer.subscription.updated, customer.subscription.deleted
export async function POST(req: NextRequest) {
  const s = stripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!s || !secret) return new NextResponse("Stripe webhook not configured", { status: 500 });

  let event: Stripe.Event;
  try {
    event = s.webhooks.constructEvent(await req.text(), req.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return new NextResponse("Bad signature", { status: 400 });
  }

  if (event.type.startsWith("customer.subscription.")) {
    await syncSubscription(event.data.object as Stripe.Subscription);
  }
  return NextResponse.json({ received: true });
}
