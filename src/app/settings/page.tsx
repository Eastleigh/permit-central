import Link from "next/link";
import { TradePicker, ZipPicker } from "@/components/Pickers";
import { hasAccess, requireUser } from "@/lib/auth";
import { parseList } from "@/lib/config";
import { coveredZips } from "@/lib/permits";
import { saveSettings } from "../actions";

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  trialing: "Free trial",
  past_due: "Payment problem — please update your card",
  canceled: "Cancelled",
  none: "Not subscribed",
};

type Props = { searchParams: Promise<{ saved?: string; error?: string }> };

export default async function Settings({ searchParams }: Props) {
  const user = await requireUser();
  const { saved, error } = await searchParams;
  const zips = await coveredZips();
  const myZips = parseList(user.zips);
  const uncovered = myZips.filter((z) => !zips.includes(z));

  return (
    <>
      {saved && <p className="notice">Saved.</p>}
      {error && <p className="error">Pick at least one trade and one ZIP code.</p>}

      <form action={saveSettings} className="card">
        <h1>Settings</h1>
        <p className="muted small">{user.email}</p>
        <label className="field"><span>Business name</span><input type="text" name="business" defaultValue={user.business_name ?? ""} /></label>
        <p><b>Your trades</b></p>
        <TradePicker selected={parseList(user.trades)} />
        <p><b>Your ZIP codes</b></p>
        <ZipPicker zips={[...zips, ...uncovered]} selected={myZips} />
        <label className="field">
          <span>Add other ZIPs <span className="muted small">(we'll include them when we cover them)</span></span>
          <input type="text" name="extraZips" inputMode="numeric" placeholder="e.g. 78664, 78665" />
        </label>
        <label className="chip" style={{ display: "inline-block", marginBottom: 16 }}>
          <input type="checkbox" name="emailEnabled" defaultChecked={!!user.email_enabled} />
          <span>Send me the morning email</span>
        </label>
        <button className="btn" type="submit">Save</button>
      </form>

      <div className="card">
        <h2>Billing</h2>
        <p>Status: <b>{STATUS_LABEL[user.status] ?? user.status}</b></p>
        {user.stripe_customer_id ? (
          <form action="/api/stripe/portal" method="post">
            <button className="btn secondary" type="submit">Manage billing, card or cancel</button>
          </form>
        ) : (
          !hasAccess(user) && <Link className="btn" href="/billing">Subscribe</Link>
        )}
      </div>
    </>
  );
}
