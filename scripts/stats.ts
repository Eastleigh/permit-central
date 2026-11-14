// Quick look at what's in the database: permits per category and per trade.
import { all } from "../src/lib/db";
import { TRADES } from "../src/lib/trades";

async function main() {
  console.table(await all("SELECT category, count(*) AS permits FROM permits GROUP BY category ORDER BY permits DESC"));
  const rows = [];
  for (const t of TRADES) {
    const [r] = await all<{ n: number }>("SELECT count(*) AS n FROM permits WHERE trades LIKE ?", [`%,${t.id},%`]);
    rows.push({ trade: t.label, permits: r.n });
  }
  console.table(rows);
  const [u] = await all<{ n: number }>("SELECT count(*) AS n FROM permits WHERE trades = ''");
  console.log("Untagged (no trade match):", u.n);
}

main();
