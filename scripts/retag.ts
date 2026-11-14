// Re-run the trade tagger over every stored permit. Use after changing rules in src/lib/trades.ts.
import { all, db } from "../src/lib/db";
import { tagPermit } from "../src/lib/trades";
import type { PermitCategory } from "../src/sources/types";

async function main() {
  const rows = await all<{ id: string; category: PermitCategory; description: string }>(
    "SELECT id, category, description FROM permits",
  );
  const stmts = rows.map((r) => {
    const { trades, reasons } = tagPermit({ category: r.category, description: r.description ?? "" });
    return {
      sql: "UPDATE permits SET trades = ?, tag_reasons = ? WHERE id = ?",
      args: [trades.length ? `,${trades.join(",")},` : "", JSON.stringify(reasons), r.id],
    };
  });
  for (let i = 0; i < stmts.length; i += 200) await db().batch(stmts.slice(i, i + 200), "write");
  console.log(`Re-tagged ${rows.length} permits.`);
}

main();
