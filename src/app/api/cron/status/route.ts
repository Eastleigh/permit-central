import { NextResponse, type NextRequest } from "next/server";
import { all } from "@/lib/db";

// Recent ingest/digest runs, for checking the morning job actually fired. Same secret as the cron.
export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const runs = await all("SELECT kind, started_at, summary FROM runs ORDER BY started_at DESC LIMIT 20");
  return NextResponse.json({ runs });
}
