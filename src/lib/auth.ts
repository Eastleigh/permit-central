import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { one, run } from "./db";

const SESSION_COOKIE = "pc_session";
const SESSION_DAYS = 60;
const LOGIN_LINK_MINUTES = 60;

export interface User {
  id: number;
  email: string;
  business_name: string | null;
  trades: string;
  zips: string;
  status: "none" | "trialing" | "active" | "past_due" | "canceled";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  email_enabled: number;
  last_digest_at: string | null;
  created_at: string;
}

export const hasAccess = (u: User) => u.status === "active" || u.status === "trialing";

const newToken = () => crypto.randomBytes(32).toString("base64url");
const inMinutes = (m: number) => new Date(Date.now() + m * 60_000).toISOString();

export async function createLoginToken(userId: number) {
  const token = newToken();
  await run("INSERT INTO login_tokens (token, user_id, expires_at) VALUES (?, ?, ?)", [token, userId, inMinutes(LOGIN_LINK_MINUTES)]);
  return token;
}

/**
 * Returns the user id for a login link, or null if it's unknown or expired. Links stay valid until they
 * expire rather than working once, because email security scanners often "click" links before the user does.
 */
export async function verifyLoginToken(token: string) {
  const now = new Date().toISOString();
  await run("DELETE FROM login_tokens WHERE expires_at < ?", [now]);
  const row = await one<{ user_id: number }>("SELECT user_id FROM login_tokens WHERE token = ?", [token]);
  return row?.user_id ?? null;
}

/** Call only from a route handler or server action (it sets a cookie). */
export async function startSession(userId: number) {
  const token = newToken();
  const expires = inMinutes(SESSION_DAYS * 24 * 60);
  await run("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)", [token, userId, expires]);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expires),
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await run("DELETE FROM sessions WHERE token = ?", [token]);
  jar.delete(SESSION_COOKIE);
}

export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const user = await one<User>(
    `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > ?`,
    [token, new Date().toISOString()],
  );
  return user ?? null;
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

/** Logged in and paying (or in the free trial). */
export async function requireSubscriber() {
  const user = await requireUser();
  if (!hasAccess(user)) redirect("/billing");
  return user;
}
