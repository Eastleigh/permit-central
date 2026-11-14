import { formatDate, formatMoney, mapsLink, permitReasons, permitTrades, type Permit } from "@/lib/permits";
import { tradeLabel } from "@/lib/trades";

/** `highlight`: the trades the viewer cares about — their "why" lines are shown. */
export function PermitCard({ permit: p, highlight }: { permit: Permit; highlight: string[] }) {
  const trades = permitTrades(p);
  const reasons = permitReasons(p);
  const why = [...new Set(trades.filter((t) => highlight.includes(t)).map((t) => reasons[t]).filter(Boolean))];
  const value = formatMoney(p.valuation);

  return (
    <article className="permit">
      <div className="permit-top">
        <span>{p.permit_class ?? p.category}{p.work_class ? ` · ${p.work_class}` : ""}</span>
        <span>{formatDate(p.issue_date)}</span>
      </div>
      <a className="permit-addr" href={mapsLink(p)} target="_blank" rel="noreferrer">
        {p.address}<span className="muted small" style={{ fontWeight: 400 }}> · {p.zip}</span>
      </a>
      <div className="tags">
        {trades.map((t) => <span key={t} className="tag">{tradeLabel(t)}</span>)}
      </div>
      {why.map((w) => <div key={w} className="why">Why: {w}</div>)}
      {p.description && <p className="permit-desc">{p.description.length > 220 ? `${p.description.slice(0, 220)}…` : p.description}</p>}
      <div className="permit-meta">
        {p.contractor_name && <span>Builder: {p.contractor_name}</span>}
        {p.sqft && <span>{Number(p.sqft).toLocaleString()} sq ft</span>}
        {value && <span>Value: {value}</span>}
        <span>#{p.permit_number}</span>
      </div>
      <div className="permit-links">
        <a href={mapsLink(p)} target="_blank" rel="noreferrer">Map</a>
        {p.link && <a href={p.link} target="_blank" rel="noreferrer">City record</a>}
      </div>
    </article>
  );
}
