import { all } from "./db";
import type { TradeId } from "./trades";

export interface Permit {
  id: string;
  source: string;
  permit_number: string;
  issue_date: string;
  address: string;
  city: string | null;
  zip: string | null;
  category: string;
  permit_class: string | null;
  work_class: string | null;
  description: string | null;
  valuation: number | null;
  sqft: number | null;
  link: string | null;
  contractor_name: string | null;
  trades: string;
  tag_reasons: string;
  first_seen_at: string;
}

export const permitTrades = (p: Permit) => p.trades.split(",").filter(Boolean) as TradeId[];
export const permitReasons = (p: Permit) => JSON.parse(p.tag_reasons || "{}") as Partial<Record<TradeId, string>>;
export const mapsLink = (p: Permit) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.address}, ${p.city ?? ""} ${p.zip ?? ""}`)}`;

export interface PermitFilter {
  trades: string[];      // match any of these; empty = any tagged permit
  zips: string[];        // empty = all ZIPs
  issuedSince?: string;  // YYYY-MM-DD
  firstSeenAfter?: string; // ISO timestamp
  search?: string;
  limit: number;
  offset?: number;
}

export async function findPermits(f: PermitFilter) {
  const where: string[] = ["trades != ''"];
  const args: (string | number)[] = [];
  if (f.trades.length) {
    where.push(`(${f.trades.map(() => "trades LIKE ?").join(" OR ")})`);
    args.push(...f.trades.map((t) => `%,${t},%`));
  }
  if (f.zips.length) {
    where.push(`zip IN (${f.zips.map(() => "?").join(",")})`);
    args.push(...f.zips);
  }
  if (f.issuedSince) {
    where.push("issue_date >= ?");
    args.push(f.issuedSince);
  }
  if (f.firstSeenAfter) {
    where.push("first_seen_at > ?");
    args.push(f.firstSeenAfter);
  }
  if (f.search) {
    where.push("(address LIKE ? OR description LIKE ? OR contractor_name LIKE ?)");
    const q = `%${f.search}%`;
    args.push(q, q, q);
  }
  const sql = `SELECT * FROM permits WHERE ${where.join(" AND ")}`;
  const [rows, [{ n }]] = await Promise.all([
    all<Permit>(`${sql} ORDER BY issue_date DESC, id LIMIT ? OFFSET ?`, [...args, f.limit, f.offset ?? 0]),
    all<{ n: number }>(`SELECT count(*) AS n FROM (${sql})`, args),
  ]);
  return { rows, total: Number(n) };
}

/** ZIPs we have permit data for — anything seen in the last year from any source. */
export async function coveredZips() {
  const since = new Date(Date.now() - 365 * 864e5).toISOString().slice(0, 10);
  const rows = await all<{ zip: string }>(
    "SELECT DISTINCT zip FROM permits WHERE zip IS NOT NULL AND issue_date >= ? ORDER BY zip",
    [since],
  );
  return rows.map((r) => r.zip);
}

export const daysAgoDate = (days: number) => new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);

/** Live numbers for the homepage: what landed in the last 30 days, per trade, plus a recent sample lead. */
export async function homepageStats() {
  const since30 = daysAgoDate(30);
  const [counts] = await all<Record<string, number>>(
    `SELECT
       count(*) AS total,
       sum(issue_date >= ?) AS week,
       sum(category = 'new_home') AS new_homes,
       sum(trades LIKE '%,fence,%') AS fence,
       sum(trades LIKE '%,landscaping,%') AS landscaping,
       sum(trades LIKE '%,pool,%') AS pool,
       sum(trades LIKE '%,gutters,%') AS gutters,
       sum(trades LIKE '%,blinds,%') AS blinds
     FROM permits WHERE trades != '' AND issue_date >= ?`,
    [daysAgoDate(7), since30],
  );
  const sample = await all<Permit>(
    `SELECT * FROM permits WHERE category = 'new_home' AND sqft IS NOT NULL AND contractor_name IS NOT NULL
     ORDER BY issue_date DESC LIMIT 1`,
  );
  const n = (k: string) => Number(counts?.[k] ?? 0);
  return {
    total: n("total"),
    week: n("week"),
    newHomes: n("new_homes"),
    byTrade: { fence: n("fence"), landscaping: n("landscaping"), pool: n("pool"), gutters: n("gutters"), blinds: n("blinds") },
    sample: sample[0] ?? null,
  };
}

/** One ZIP's last 30 days: tagged-permit total, count per trade, and the newest few leads (for teasers). */
export async function zipBreakdown(zip: string) {
  const since = daysAgoDate(30);
  const [counts] = await all<Record<string, number>>(
    `SELECT count(*) AS total,
       sum(trades LIKE '%,fence,%') AS fence,
       sum(trades LIKE '%,landscaping,%') AS landscaping,
       sum(trades LIKE '%,pool,%') AS pool,
       sum(trades LIKE '%,gutters,%') AS gutters,
       sum(trades LIKE '%,blinds,%') AS blinds
     FROM permits WHERE trades != '' AND zip = ? AND issue_date >= ?`,
    [zip, since],
  );
  const candidates = await all<Permit>(
    `SELECT * FROM permits WHERE trades != '' AND zip = ? AND issue_date >= ?
     ORDER BY CASE category WHEN 'new_home' THEN 0 WHEN 'accessory' THEN 1 WHEN 'teardown' THEN 2 ELSE 3 END,
              issue_date DESC, id
     LIMIT 20`,
    [zip, since],
  );
  // One per property: "4608 BANISTER LN BLDG 1/2/3" is one development, not three separate opportunities.
  const seen = new Set<string>();
  const latest = candidates
    .filter((p) => {
      const key = p.address.replace(/\s+(BLDG|UNIT|APT|#)\s*\S*$/i, "");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3);
  const n = (k: string) => Number(counts?.[k] ?? 0);
  return {
    total: n("total"),
    byTrade: { fence: n("fence"), landscaping: n("landscaping"), pool: n("pool"), gutters: n("gutters"), blinds: n("blinds") },
    latest,
  };
}

/** "8913 BREEZE HILL DR" → "89•• Breeze Hill Dr": enough to prove it's real, not enough to use without signing up. */
export const teaserAddress = (address: string) =>
  address
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/^(\d{1,2})\d*/, (_, keep: string) => `${keep}••`);

export const formatDate = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export const formatMoney = (n: number | null) =>
  n ? `$${n >= 1000 ? `${Math.round(n / 1000).toLocaleString()}k` : n.toLocaleString()}` : null;
