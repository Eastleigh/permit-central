import { NextResponse, type NextRequest } from "next/server";
import { startSession, verifyLoginToken } from "@/lib/auth";
import { APP_URL } from "@/lib/config";

export async function GET(req: NextRequest) {
  const userId = await verifyLoginToken(req.nextUrl.searchParams.get("token") ?? "");
  if (!userId) return NextResponse.redirect(`${APP_URL}/login?expired=1`);
  await startSession(userId);
  return NextResponse.redirect(`${APP_URL}/dashboard`);
}
