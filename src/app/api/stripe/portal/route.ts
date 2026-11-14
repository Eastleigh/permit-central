import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { liveCustomerId, stripe } from "@/lib/billing";
import { APP_URL } from "@/lib/config";

/** Stripe's hosted page for updating the card, seeing invoices, or cancelling. */
export async function POST() {
  const user = await currentUser();
  const s = stripe();
  const customer = user && s ? await liveCustomerId(s, user) : null;
  if (!s || !customer) return NextResponse.redirect(`${APP_URL}/billing`, 303);
  const portal = await s.billingPortal.sessions.create({
    customer,
    return_url: `${APP_URL}/settings`,
  });
  return NextResponse.redirect(portal.url, 303);
}
