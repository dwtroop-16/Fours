import { mkdirSync } from "fs";
import path from "path";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "@/lib/db/schema";

export type Db = ReturnType<typeof drizzleNeon<typeof schema>> | ReturnType<typeof drizzlePglite<typeof schema>>;

type GlobalDb = {
  __foursDb?: Db;
  __foursPglite?: PGlite;
  __foursDbReady?: Promise<void>;
};

function getGlobal(): GlobalDb {
  return globalThis as unknown as GlobalDb;
}

export function usingNeon(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb(): Db {
  const g = getGlobal();
  if (g.__foursDb) return g.__foursDb;

  if (process.env.DATABASE_URL) {
    const sql = neon(process.env.DATABASE_URL);
    g.__foursDb = drizzleNeon(sql, { schema });
    return g.__foursDb;
  }

  const dataDir = path.join(process.cwd(), ".data");
  mkdirSync(dataDir, { recursive: true });
  const pglite = new PGlite(path.join(dataDir, "fours-pg"));
  g.__foursPglite = pglite;
  g.__foursDb = drizzlePglite(pglite, { schema });
  return g.__foursDb;
}

/** Ensure schema exists (idempotent CREATE TABLE IF NOT EXISTS). */
export async function ensureSchema(): Promise<void> {
  const g = getGlobal();
  if (g.__foursDbReady) return g.__foursDbReady;

  g.__foursDbReady = (async () => {
    const db = getDb();

    if (process.env.DATABASE_URL) {
      const sql = neon(process.env.DATABASE_URL);
      for (const statement of DDL) {
        await sql.query(statement);
      }
      return;
    }

    const pglite = g.__foursPglite;
    if (!pglite) throw new Error("PGlite not initialized");
    for (const statement of DDL) {
      await pglite.exec(statement);
    }
    // silence unused db for type narrowing
    void db;
  })();

  return g.__foursDbReady;
}

const DDL = [
  `CREATE TABLE IF NOT EXISTS offers (
    id text PRIMARY KEY,
    name text NOT NULL,
    vertical text NOT NULL,
    network text NOT NULL,
    payout double precision NOT NULL,
    currency text NOT NULL,
    tracking_url text NOT NULL,
    status text NOT NULL,
    created_at text NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS campaigns (
    id text PRIMARY KEY,
    name text NOT NULL,
    offer_id text NOT NULL,
    platform text NOT NULL,
    external_id text NOT NULL,
    status text NOT NULL,
    daily_budget double precision NOT NULL,
    bid double precision NOT NULL,
    targeting jsonb NOT NULL,
    created_at text NOT NULL,
    updated_at text NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS conversions (
    id text PRIMARY KEY,
    campaign_id text NOT NULL,
    offer_id text NOT NULL,
    click_id text NOT NULL,
    payout double precision NOT NULL,
    occurred_at text NOT NULL,
    source text NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS spend_events (
    id text PRIMARY KEY,
    campaign_id text NOT NULL,
    impressions integer NOT NULL,
    clicks integer NOT NULL,
    spend double precision NOT NULL,
    occurred_at text NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS rules (
    id text PRIMARY KEY,
    name text NOT NULL,
    enabled boolean NOT NULL,
    campaign_ids jsonb NOT NULL,
    metric text NOT NULL,
    operator text NOT NULL,
    threshold double precision NOT NULL,
    lookback_hours integer NOT NULL,
    min_spend double precision,
    action text NOT NULL,
    action_value double precision,
    cooldown_minutes integer NOT NULL,
    last_fired_at text,
    created_at text NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS executions (
    id text PRIMARY KEY,
    rule_id text NOT NULL,
    campaign_id text NOT NULL,
    action text NOT NULL,
    metric_value double precision NOT NULL,
    threshold double precision NOT NULL,
    message text NOT NULL,
    executed_at text NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS platform_sync_logs (
    id text PRIMARY KEY,
    at text NOT NULL,
    platform text NOT NULL,
    campaign_id text NOT NULL,
    action text NOT NULL,
    detail text NOT NULL,
    ok boolean NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS conversions_campaign_idx ON conversions (campaign_id)`,
  `CREATE INDEX IF NOT EXISTS spend_events_campaign_idx ON spend_events (campaign_id)`,
  `CREATE INDEX IF NOT EXISTS executions_executed_at_idx ON executions (executed_at)`,
];
