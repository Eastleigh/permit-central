import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { GUARANTEE_DAYS, PRICE_LABEL, SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_PHONE_TEL, TRIAL_DAYS, isZip } from "@/lib/config";
import { coveredZips, formatDate, homepageStats, permitReasons, permitTrades, teaserAddress, zipBreakdown } from "@/lib/permits";
import { tradeLabel } from "@/lib/trades";
import { SOURCES } from "@/sources";
import { joinWaitlist } from "./actions";

type Props = { searchParams: Promise<{ zip?: string; waitlisted?: string; error?: string }> };

// Rough, conservative job values used for the "one job pays for it" math. Tune these to your market.
const TRADE_PITCH = [
  { id: "fence", label: "Fence", job: "$3,000–$8,000", why: "Every new home and every new pool needs one. Pools need a barrier fence by code." },
  { id: "landscaping", label: "Landscaping", job: "$5,000–$20,000", why: "New homes get handed over with bare dirt. Pools, patios and teardowns tear up yards." },
  { id: "pool", label: "Pool", job: "$1,500+/yr service", why: "New pool permits are your next service accounts. New homes with yards are pool prospects." },
  { id: "gutters", label: "Gutters", job: "$1,000–$3,000", why: "New roofs, re-roofs and additions all change the roofline." },
  { id: "blinds", label: "Blinds & shades", job: "$2,000–$6,000", why: "Every new home has bare windows on move-in day. Additions and window replacements too." },
] as const;

const FAQ = [
  {
    q: "Where do the leads come from?",
    a: "Official building permit records published by the city. We pull them every day, keep the residential ones, and tag each permit with the trades that will want the job next.",
  },
  {
    q: "Are the leads exclusive?",
    a: "No. Permits are public records, and we're upfront about that. The edge is speed and focus: you see the permit the morning after it's issued, already filtered to your trade and ZIPs, while most contractors never look.",
  },
  {
    q: "How do I reach the homeowner?",
    a: "You get the address, the type of work, the size of the project and the builder's name. Contractors use door hangers, postcards or a friendly knock — and for new homes, calling the builder about subcontract work.",
  },
  {
    q: "What if there aren't many permits in my area?",
    a: "Check your ZIP above before you sign up — it tells you how many permits we tagged there in the last 30 days. The free trial lets you see real leads before you pay anything.",
  },
  {
    q: "What if it doesn't pay off for me?",
    a: `Then you get your money back. If you're not happy within ${GUARANTEE_DAYS} days of your first payment, email ${SUPPORT_EMAIL} and we'll refund it in full. No questions asked, no forms.`,
  },
  {
    q: "Can I cancel?",
    a: "Anytime, in two taps from Settings. No contracts, no cancellation fees.",
  },
];

export default async function Home({ searchParams }: Props) {
  if (await currentUser()) redirect("/dashboard");
  const { zip = "", waitlisted, error } = await searchParams;
  const checked = isZip(zip);
  const [zips, stats] = await Promise.all([coveredZips(), homepageStats()]);
  const covered = checked && zips.includes(zip);
  const zipStats = covered ? await zipBreakdown(zip) : null;
  const signupHref = covered ? `/signup?zip=${zip}` : "/signup";
  const trialCta = TRIAL_DAYS > 0 ? `Start your ${TRIAL_DAYS}-day free trial` : "Get started";
  const sample = stats.sample;
  const area = SOURCES.map((s) => s.name.replace(/^City of /, "")).join(", ");

  return (
    <>
      <section className="lp-hero">
        <p className="eyebrow">Daily permit leads · {area}</p>
        <h1>Find out who needs your trade <span>before they start calling around.</span></h1>
        <p className="lp-sub">
          Every morning we send you the new building permits in your ZIP codes — new homes, pools, additions, teardowns —
          already matched to your trade. You show up first.
        </p>
        <form method="get" action="/" className="zipcheck">
          <input name="zip" inputMode="numeric" pattern="\d{5}" maxLength={5} placeholder="Enter your ZIP" defaultValue={zip} required aria-label="ZIP code" />
          <button className="btn" type="submit">See my leads</button>
        </form>
        <p className="lp-fine">{TRIAL_DAYS > 0 ? `${TRIAL_DAYS} days free · ` : ""}{PRICE_LABEL}/month after · {GUARANTEE_DAYS}-day money-back guarantee</p>
        <p className="lp-call">📞 Questions? Call a real person: <a href={SUPPORT_PHONE_TEL}>{SUPPORT_PHONE}</a></p>
      </section>

      {zipStats && (
        <div className="card zip-result">
          <h2>{zipStats.total} leads in {zip} in the last 30 days</h2>
          <div className="zip-trades">
            {TRADE_PITCH.map((t) => (
              <div key={t.id} className="zip-trade"><b>{zipStats.byTrade[t.id]}</b><span>{t.label.split(" ")[0]}</span></div>
            ))}
          </div>
          {zipStats.latest.length > 0 && (
            <>
              <p className="zip-latest-title">Recent leads in {zip}:</p>
              <ul className="zip-latest">
                {zipStats.latest.map((p) => (
                  <li key={p.id}>
                    <b>{teaserAddress(p.address)}</b>
                    <span>{p.permit_class ?? p.category} · {formatDate(p.issue_date)}</span>
                    <span className="zip-latest-tags">{permitTrades(p).map(tradeLabel).join(" · ")}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="muted small">Lists like this land in your inbox every morning, filtered to your trade.</p>
          <Link className="btn" href={signupHref}>{trialCta}</Link>
        </div>
      )}

      {checked && !covered && (
        <div className="card zip-result">
          {waitlisted ? (
            <p className="notice">You're on the list. We'll email you when we cover {zip}.</p>
          ) : (
            <>
              <h2>We're not in {zip} yet.</h2>
              <p>We add new areas based on demand. Leave your email and you'll be first to know when we launch near you.</p>
              {error && <p className="error">Please enter a valid email.</p>}
              <form action={joinWaitlist}>
                <input type="hidden" name="zip" value={zip} />
                <label className="field"><span>Email</span><input type="email" name="email" required /></label>
                <button className="btn" type="submit">Join the waitlist</button>
              </form>
            </>
          )}
        </div>
      )}

      <section className="stats">
        <div className="stat"><b>{stats.week.toLocaleString()}</b><span>leads tagged in the last 7 days</span></div>
        <div className="stat"><b>{stats.newHomes.toLocaleString()}</b><span>new homes permitted in the last 30 days</span></div>
        <div className="stat"><b>Same morning</b><span>in your inbox as soon as the city posts them</span></div>
      </section>

      {sample && (
        <section className="lp-section">
          <h2>This is what a lead looks like</h2>
          <p className="muted">A real permit from {formatDate(sample.issue_date)}. Subscribers see the full address, the map and the city record.</p>
          <article className="permit sample">
            <div className="permit-top">
              <span>{sample.permit_class ?? "New home"}{sample.work_class ? ` · ${sample.work_class}` : ""}</span>
              <span>{formatDate(sample.issue_date)}</span>
            </div>
            <div className="permit-addr">{teaserAddress(sample.address)}<span className="muted small" style={{ fontWeight: 400 }}> · {sample.zip}</span></div>
            <div className="tags">{permitTrades(sample).map((t) => <span key={t} className="tag">{tradeLabel(t)}</span>)}</div>
            <div className="why">Why: {Object.values(permitReasons(sample))[0]}</div>
            {sample.description && <p className="permit-desc">{sample.description.slice(0, 160)}{sample.description.length > 160 ? "…" : ""}</p>}
            <div className="permit-meta">
              {sample.contractor_name && <span>Builder: {sample.contractor_name}</span>}
              {sample.sqft && <span>{Number(sample.sqft).toLocaleString()} sq ft</span>}
            </div>
            <div className="locked">🔒 Full address, map and city record unlock with your free trial</div>
          </article>
        </section>
      )}

      <section className="lp-section">
        <h2>One job pays for years of {PRICE_LABEL}/month</h2>
        <p className="muted">Here's what landed in the last 30 days, by trade, and what a typical job is worth.</p>
        <div className="trades">
          {TRADE_PITCH.map((t) => (
            <div key={t.id} className="trade">
              <div className="trade-head">
                <b>{t.label}</b>
                <span className="trade-count">{stats.byTrade[t.id].toLocaleString()} leads</span>
              </div>
              <p>{t.why}</p>
              <p className="trade-job">Typical job: <b>{t.job}</b></p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section">
        <h2>Permit Central vs. pay-per-lead sites</h2>
        <div className="compare">
          <div className="compare-col them">
            <b>Pay-per-lead sites</b>
            <ul>
              <li>Pay for every lead, whether it closes or not</li>
              <li>Same lead sold to several contractors at once</li>
              <li>Homeowner is already collecting quotes</li>
            </ul>
          </div>
          <div className="compare-col us">
            <b>Permit Central</b>
            <ul>
              <li>One flat {PRICE_LABEL}/month — unlimited leads in your ZIPs</li>
              <li>You see the job the morning after the permit is issued</li>
              <li>Reach the homeowner before they start shopping</li>
              <li>{GUARANTEE_DAYS}-day money-back guarantee</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <h2>How it works</h2>
        <ol className="how">
          <li><b>Pick your trade and ZIP codes.</b> Takes a minute, no password needed.</li>
          <li><b>We read every new permit.</b> Pulled from city records daily and tagged for your trade, with the reason it fits.</li>
          <li><b>Leads hit your inbox every morning.</b> Tap an address for the map. Browse and filter anytime on your phone.</li>
        </ol>
      </section>

      <section className="lp-section">
        <h2>Questions</h2>
        <div className="faq">
          {FAQ.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="guarantee">
        <div className="guarantee-badge" aria-hidden="true"><b>{GUARANTEE_DAYS}</b><span>DAY</span></div>
        <div>
          <h2>{GUARANTEE_DAYS}-day money-back guarantee</h2>
          <p>
            {TRIAL_DAYS > 0 && `Try it free for ${TRIAL_DAYS} days. `}If you're not happy within {GUARANTEE_DAYS} days of your first payment, email{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and we'll refund it in full. No questions asked.
          </p>
        </div>
      </section>

      <section className="lp-final">
        <h2>Most of your competitors aren't reading permits. You will be.</h2>
        <div className="price">{PRICE_LABEL}<span> / month</span></div>
        <p>{TRIAL_DAYS > 0 ? `First ${TRIAL_DAYS} days free. ` : ""}Unlimited leads in your ZIPs. {GUARANTEE_DAYS}-day money-back guarantee.</p>
        <Link className="btn" href={signupHref}>{trialCta}</Link>
        <p className="small">Questions first? Call <a href={SUPPORT_PHONE_TEL}>{SUPPORT_PHONE}</a> and talk to a real person.</p>
      </section>

      <p className="muted small" style={{ textAlign: "center" }}>Now covering {SOURCES.map((s) => s.name).join(", ")}. More cities coming soon.</p>

      {/* Phones only: keeps the trial one tap away while scrolling. The spacer stops it covering the last lines. */}
      <div className="sticky-spacer" aria-hidden="true" />
      <div className="sticky-cta">
        <Link className="btn" href={signupHref}>{trialCta}</Link>
        <span>{PRICE_LABEL}/mo after · Questions? <a href={SUPPORT_PHONE_TEL}>Call {SUPPORT_PHONE}</a></span>
      </div>
    </>
  );
}
