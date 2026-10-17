import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  text,
} from "drizzle-orm/pg-core";

export const offers = pgTable("offers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  vertical: text("vertical").notNull(),
  network: text("network").notNull(),
  payout: doublePrecision("payout").notNull(),
  currency: text("currency").notNull(),
  trackingUrl: text("tracking_url").notNull(),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull(),
});

export const campaigns = pgTable("campaigns", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  offerId: text("offer_id").notNull(),
  platform: text("platform").notNull(),
  externalId: text("external_id").notNull(),
  status: text("status").notNull(),
  dailyBudget: doublePrecision("daily_budget").notNull(),
  bid: doublePrecision("bid").notNull(),
  targeting: jsonb("targeting").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const conversions = pgTable("conversions", {
  id: text("id").primaryKey(),
  campaignId: text("campaign_id").notNull(),
  offerId: text("offer_id").notNull(),
  clickId: text("click_id").notNull(),
  payout: doublePrecision("payout").notNull(),
  occurredAt: text("occurred_at").notNull(),
  source: text("source").notNull(),
});

export const spendEvents = pgTable("spend_events", {
  id: text("id").primaryKey(),
  campaignId: text("campaign_id").notNull(),
  impressions: integer("impressions").notNull(),
  clicks: integer("clicks").notNull(),
  spend: doublePrecision("spend").notNull(),
  occurredAt: text("occurred_at").notNull(),
});

export const rules = pgTable("rules", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  enabled: boolean("enabled").notNull(),
  campaignIds: jsonb("campaign_ids").notNull(),
  metric: text("metric").notNull(),
  operator: text("operator").notNull(),
  threshold: doublePrecision("threshold").notNull(),
  lookbackHours: integer("lookback_hours").notNull(),
  minSpend: doublePrecision("min_spend"),
  action: text("action").notNull(),
  actionValue: doublePrecision("action_value"),
  cooldownMinutes: integer("cooldown_minutes").notNull(),
  lastFiredAt: text("last_fired_at"),
  createdAt: text("created_at").notNull(),
});

export const executions = pgTable("executions", {
  id: text("id").primaryKey(),
  ruleId: text("rule_id").notNull(),
  campaignId: text("campaign_id").notNull(),
  action: text("action").notNull(),
  metricValue: doublePrecision("metric_value").notNull(),
  threshold: doublePrecision("threshold").notNull(),
  message: text("message").notNull(),
  executedAt: text("executed_at").notNull(),
});

export const platformSyncLogs = pgTable("platform_sync_logs", {
  id: text("id").primaryKey(),
  at: text("at").notNull(),
  platform: text("platform").notNull(),
  campaignId: text("campaign_id").notNull(),
  action: text("action").notNull(),
  detail: text("detail").notNull(),
  ok: boolean("ok").notNull(),
});
