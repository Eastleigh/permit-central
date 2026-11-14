import { NextResponse, type NextRequest } from "next/server";
import { all, initDb } from "@/lib/db";
import { sendDigests } from "@/lib/digest";
import { ingestAll } from "@/lib/ingest";

export const maxDuration = 300;

// Runs every 30 minutes through the morning (see vercel.json). Austin republishes its permit data somewhere
// between ~7 and 8am Central, so each run checks for new permits and the first one that finds some sends the
// day's emails. Later runs that day do nothing; permits the city posts later are picked up tomorrow.
export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  await initDb();
  const today = new Date().toISOString().slice(0, 10);
  const runs = await all<{ summary: string }>("SELECT summary FROM runs WHERE kind = 'ingest' AND started_at >= ?", [today]);
  const addedToday = (summary: string) =>
    Object.values(JSON.parse(summary) as Record<string, { added: number }>).some((s) => s.added > 0);
  if (runs.some((r) => addedToday(r.summary))) return NextResponse.json({ skipped: "already sent today" });

  const ingest = await ingestAll();
  if (!Object.values(ingest).some((s) => s.added > 0)) return NextResponse.json({ ingest, waiting: "no new permits yet" });
  const digest = await sendDigests();
  return NextResponse.json({ ingest, digest });
}
