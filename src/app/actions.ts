"use server";

import { redirect } from "next/navigation";
import { createLoginToken, endSession, requireUser, type User } from "@/lib/auth";
import { APP_URL, isDevMode, isZip, parseList } from "@/lib/config";
import { nowIso, one, run } from "@/lib/db";
import { loginEmail, sendEmail } from "@/lib/email";
import { isTrade } from "@/lib/trades";

const cleanEmail = (v: FormDataEntryValue | null) => String(v ?? "").trim().toLowerCase();
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const MAX_LINKS_PER_HOUR = 5;

async function sendLoginLink(user: Pick<User, "id" | "email">) {
  // Login links last an hour, so unexpired links = links sent in the last hour. Past the limit, stay quiet.
  const recent = await one<{ n: number }>(
    "SELECT count(*) AS n FROM login_tokens WHERE user_id = ? AND expires_at > ?",
    [user.id, nowIso()],
  );
  if (Number(recent?.n) >= MAX_LINKS_PER_HOUR) redirect("/check-email");

  const token = await createLoginToken(user.id);
  const link = `${APP_URL}/api/auth/verify?token=${token}`;
  await sendEmail(loginEmail(user.email, link));
  // Locally without Resend, show the link on the page so you can click straight through.
  const devLink = isDevMode && !process.env.RESEND_API_KEY ? `?dev=${encodeURIComponent(link)}` : "";
  redirect(`/check-email${devLink}`);
}

export async function joinWaitlist(formData: FormData) {
  const email = cleanEmail(formData.get("email"));
  const zip = String(formData.get("zip") ?? "").trim();
  if (!isEmail(email) || !isZip(zip)) redirect(`/?zip=${encodeURIComponent(zip)}&error=email`);
  await run("INSERT OR IGNORE INTO waitlist (email, zip, created_at) VALUES (?, ?, ?)", [email, zip, nowIso()]);
  redirect(`/?zip=${zip}&waitlisted=1`);
}

export async function signup(formData: FormData) {
  const email = cleanEmail(formData.get("email"));
  const business = String(formData.get("business") ?? "").trim().slice(0, 120);
  const trades = formData.getAll("trades").map(String).filter(isTrade);
  const zips = formData.getAll("zips").map(String).filter(isZip);

  const back = (error: string) => redirect(`/signup?error=${error}&zip=${zips[0] ?? ""}`);
  if (!isEmail(email)) back("email");
  if (!trades.length) back("trade");
  if (!zips.length) back("zip");

  let user = await one<User>("SELECT * FROM users WHERE email = ?", [email]);
  if (!user) {
    user = await one<User>(
      "INSERT INTO users (email, business_name, trades, zips, created_at) VALUES (?, ?, ?, ?, ?) RETURNING *",
      [email, business || null, trades.join(","), zips.join(","), nowIso()],
    );
  } else if (user.status === "none") {
    // Signed up before but never paid: take their latest choices.
    await run("UPDATE users SET business_name = ?, trades = ?, zips = ? WHERE id = ?", [business || null, trades.join(","), zips.join(","), user.id]);
  }
  await sendLoginLink(user!);
}

export async function requestLogin(formData: FormData) {
  const email = cleanEmail(formData.get("email"));
  const user = await one<User>("SELECT * FROM users WHERE email = ?", [email]);
  if (user) await sendLoginLink(user);
  redirect("/check-email"); // same page either way, so we don't reveal who has an account
}

export async function saveSettings(formData: FormData) {
  const user = await requireUser();
  const trades = formData.getAll("trades").map(String).filter(isTrade);
  const zips = formData.getAll("zips").map(String).filter(isZip);
  const extraZips = parseList(formData.get("extraZips")).filter(isZip);
  const allZips = [...new Set([...zips, ...extraZips])];
  if (!trades.length || !allZips.length) redirect("/settings?error=1");
  await run(
    "UPDATE users SET business_name = ?, trades = ?, zips = ?, email_enabled = ? WHERE id = ?",
    [String(formData.get("business") ?? "").trim() || null, trades.join(","), allZips.join(","), formData.get("emailEnabled") ? 1 : 0, user.id],
  );
  redirect("/settings?saved=1");
}

export async function logout() {
  await endSession();
  redirect("/");
}
