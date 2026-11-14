import Link from "next/link";
import { PermitCard } from "@/components/PermitCard";
import { requireSubscriber } from "@/lib/auth";
import { parseList } from "@/lib/config";
import { coveredZips, daysAgoDate, findPermits } from "@/lib/permits";
import { TRADES, isTrade } from "@/lib/trades";

const PAGE_SIZE = 30;

type Props = { searchParams: Promise<{ trade?: string; zip?: string; days?: string; q?: string; page?: string; welcome?: string }> };

export default async function Dashboard({ searchParams }: Props) {
  const user = await requireSubscriber();
  const params = await searchParams;
  const myTrades = parseList(user.trades);
  const myZips = parseList(user.zips);

  // Defaults: my trades, my ZIPs, last 7 days.
  const trade = params.trade && (params.trade === "all" || isTrade(params.trade)) ? params.trade : "mine";
  const zip = params.zip || "mine";
  const days = [1, 7, 30, 60].includes(Number(params.days)) ? Number(params.days) : 7;
  const q = (params.q ?? "").trim().slice(0, 80);
  const page = Math.max(1, Number(params.page) || 1);

  const trades = trade === "mine" ? myTrades : trade === "all" ? [] : [trade];
  const zips = zip === "mine" ? myZips : zip === "all" ? [] : [zip];
  const [{ rows, total }, allZips] = await Promise.all([
    findPermits({ trades, zips, issuedSince: daysAgoDate(days), search: q || undefined, limit: PAGE_SIZE * page }),
    coveredZips(),
  ]);
  const highlight = trades.length ? trades : myTrades;
  const moreHref = `/dashboard?${new URLSearchParams({ trade, zip, days: String(days), q, page: String(page + 1) })}`;

  return (
    <>
      {params.welcome && <p className="notice">You're all set. Your first email arrives tomorrow morning.</p>}

      <form method="get" className="filters">
        <select name="trade" defaultValue={trade} aria-label="Trade">
          <option value="mine">My trades</option>
          {TRADES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          <option value="all">All trades</option>
        </select>
        <select name="zip" defaultValue={zip} aria-label="ZIP code">
          <option value="mine">My ZIPs</option>
          <option value="all">All ZIPs</option>
          {allZips.map((z) => <option key={z} value={z}>{z}</option>)}
        </select>
        <select name="days" defaultValue={String(days)} aria-label="Issued within">
          <option value="1">Last day</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="60">Last 60 days</option>
        </select>
        <input type="search" name="q" defaultValue={q} placeholder="Street, builder, keyword" aria-label="Search" />
        <button className="btn full" type="submit">Filter</button>
      </form>

      <p className="count">{total.toLocaleString()} permit{total === 1 ? "" : "s"}</p>

      {rows.length === 0 ? (
        <div className="card empty">
          <p><b>No permits match.</b></p>
          <p className="muted">Try a longer date range, or <Link href="/dashboard?zip=all&trade=mine&days=30">all ZIPs</Link>.</p>
        </div>
      ) : (
        rows.map((p) => <PermitCard key={p.id} permit={p} highlight={highlight} />)
      )}

      {rows.length < total && <Link className="btn secondary" href={moreHref} scroll={false}>Show more</Link>}
    </>
  );
}
