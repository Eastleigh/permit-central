import { db, nowIso, one, run } from "./db";
import { tagPermit } from "./trades";
import { SOURCES } from "@/sources";

const BACKFILL_DAYS = 60; // first run for a new source
const OVERLAP_DAYS = 3;   // re-check recent days; cities sometimes post permits late
const EMPTY_RETRIES = 3;
const EMPTY_RETRY_MS = 60_000;

const daysAgo = (date: string, days: number) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
};

/** Pull new permits from every source, tag them, and save the ones we haven't seen. */
export async function ingestAll() {
  const summary: Record<string, { fetched: number; added: number; error?: string }> = {};
  const startedAt = nowIso();

  for (const source of SOURCES) {
    try {
      const latest = await one<{ d: string | null }>(
        "SELECT max(issue_date) AS d FROM permits WHERE source = ?",
        [source.id],
      );
      const since = latest?.d
        ? daysAgo(latest.d, OVERLAP_DAYS)
        : daysAgo(startedAt.slice(0, 10), BACKFILL_DAYS);

      // The overlap window always holds permits we already have, so an empty answer means the city's feed is
      // mid-refresh (seen on Austin around 7am). Wait and ask again rather than treat it as "no new permits".
      let permits = await source.fetchIssuedSince(since);
      for (let attempt = 1; latest?.d && permits.length === 0 && attempt <= EMPTY_RETRIES; attempt++) {
        await new Promise((r) => setTimeout(r, EMPTY_RETRY_MS));
        permits = await source.fetchIssuedSince(since);
      }
      if (latest?.d && permits.length === 0) throw new Error("Feed returned no permits (likely mid-refresh)");
      const stmts = permits
        .filter((p) => p.permitNumber && p.address)
        .map((p) => {
          const { trades, reasons } = tagPermit(p);
          return {
            // INSERT OR IGNORE keeps first_seen_at stable, which is what decides "new" for email digests.
            sql: `INSERT OR IGNORE INTO permits (id, source, permit_number, issue_date, address, city, zip, category,
                    permit_class, work_class, description, valuation, sqft, lat, lng, link, contractor_name,
                    contractor_phone, trades, tag_reasons, first_seen_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              `${source.id}:${p.permitNumber}`, source.id, p.permitNumber, p.issueDate, p.address, p.city, p.zip,
              p.category, p.permitClass, p.workClass, p.description, p.valuation, p.sqft, p.lat, p.lng, p.link,
              p.contractorName, p.contractorPhone, trades.length ? `,${trades.join(",")},` : "",
              JSON.stringify(reasons), startedAt,
            ],
          };
        });

      let added = 0;
      for (let i = 0; i < stmts.length; i += 200) {
        const results = await db().batch(stmts.slice(i, i + 200), "write");
        added += results.reduce((n, r) => n + r.rowsAffected, 0);
      }
      summary[source.id] = { fetched: permits.length, added };
    } catch (err) {
      summary[source.id] = { fetched: 0, added: 0, error: String(err) };
    }
  }

  await run("INSERT INTO runs (kind, started_at, summary) VALUES ('ingest', ?, ?)", [startedAt, JSON.stringify(summary)]);
  return summary;
}
