import { createClient, type Client, type InArgs } from "@libsql/client";

let client: Client | undefined;

export function db(): Client {
  if (!client) {
    client = createClient({
      url: process.env.DATABASE_URL || "file:local.db",
      authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
    });
  }
  return client;
}

export async function all<T>(sql: string, args: InArgs = []): Promise<T[]> {
  const res = await db().execute({ sql, args });
  return res.rows as unknown as T[];
}

export async function one<T>(sql: string, args: InArgs = []): Promise<T | undefined> {
  return (await all<T>(sql, args))[0];
}

export async function run(sql: string, args: InArgs = []) {
  return db().execute({ sql, args });
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS permits (
    id TEXT PRIMARY KEY,              -- "<source>:<permit number>"
    source TEXT NOT NULL,
    permit_number TEXT NOT NULL,
    issue_date TEXT NOT NULL,         -- YYYY-MM-DD
    address TEXT NOT NULL,
    city TEXT,
    zip TEXT,
    category TEXT NOT NULL,
    permit_class TEXT,
    work_class TEXT,
    description TEXT,
    valuation REAL,
    sqft INTEGER,
    lat REAL,
    lng REAL,
    link TEXT,
    contractor_name TEXT,
    contractor_phone TEXT,
    trades TEXT NOT NULL DEFAULT '',  -- trade ids wrapped in commas, e.g. ",fence,pool,"
    tag_reasons TEXT NOT NULL DEFAULT '{}',
    first_seen_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS permits_issue_date ON permits(issue_date)`,
  `CREATE INDEX IF NOT EXISTS permits_zip ON permits(zip)`,
  `CREATE INDEX IF NOT EXISTS permits_first_seen ON permits(first_seen_at)`,
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    business_name TEXT,
    trades TEXT NOT NULL DEFAULT '',  -- comma-separated trade ids
    zips TEXT NOT NULL DEFAULT '',    -- comma-separated 5-digit ZIPs
    status TEXT NOT NULL DEFAULT 'none', -- none | trialing | active | past_due | canceled
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    email_enabled INTEGER NOT NULL DEFAULT 1,
    last_digest_at TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS login_tokens (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS waitlist (
    email TEXT NOT NULL,
    zip TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (email, zip)
  )`,
  `CREATE TABLE IF NOT EXISTS runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kind TEXT NOT NULL,
    started_at TEXT NOT NULL,
    summary TEXT
  )`,
];

export async function initDb() {
  await db().batch(SCHEMA, "write");
}

export const nowIso = () => new Date().toISOString();
