import { desc, eq } from "drizzle-orm";
import { createId } from "@/lib/id";
import { ensureSchema, getDb } from "@/lib/db/client";
import * as tables from "@/lib/db/schema";
import { createSeedData } from "@/lib/seed";
import type {
  AutomationRule,
  Campaign,
  Conversion,
  Offer,
  Platform,
  RuleExecution,
  SpendEvent,
} from "@/lib/types";

type GlobalSeed = { __foursSeeded?: boolean };

async function ready() {
  await ensureSchema();
  const g = globalThis as unknown as GlobalSeed;
  if (g.__foursSeeded) return;
  const db = getDb();
  const existing = await db.select({ id: tables.offers.id }).from(tables.offers).limit(1);
  if (existing.length === 0) {
    await insertSnapshot(createSeedData());
  }
  g.__foursSeeded = true;
}

async function insertSnapshot(snapshot: ReturnType<typeof createSeedData>) {
  const db = getDb();
  if (snapshot.offers.length) {
    await db.insert(tables.offers).values(
      snapshot.offers.map((o) => ({
        ...o,
        trackingUrl: o.trackingUrl,
      })),
    );
  }
  if (snapshot.campaigns.length) {
    await db.insert(tables.campaigns).values(
      snapshot.campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        offerId: c.offerId,
        platform: c.platform,
        externalId: c.externalId,
        status: c.status,
        dailyBudget: c.dailyBudget,
        bid: c.bid,
        targeting: c.targeting,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    );
  }
  if (snapshot.conversions.length) {
    await db.insert(tables.conversions).values(snapshot.conversions);
  }
  if (snapshot.spendEvents.length) {
    await db.insert(tables.spendEvents).values(snapshot.spendEvents);
  }
  if (snapshot.rules.length) {
    await db.insert(tables.rules).values(
      snapshot.rules.map((r) => ({
        id: r.id,
        name: r.name,
        enabled: r.enabled,
        campaignIds: r.campaignIds,
        metric: r.metric,
        operator: r.operator,
        threshold: r.threshold,
        lookbackHours: r.lookbackHours,
        minSpend: r.minSpend ?? null,
        action: r.action,
        actionValue: r.actionValue ?? null,
        cooldownMinutes: r.cooldownMinutes,
        lastFiredAt: r.lastFiredAt ?? null,
        createdAt: r.createdAt,
      })),
    );
  }
  if (snapshot.executions.length) {
    await db.insert(tables.executions).values(snapshot.executions);
  }
}

function mapOffer(row: typeof tables.offers.$inferSelect): Offer {
  return {
    id: row.id,
    name: row.name,
    vertical: row.vertical,
    network: row.network,
    payout: row.payout,
    currency: row.currency,
    trackingUrl: row.trackingUrl,
    status: row.status as Offer["status"],
    createdAt: row.createdAt,
  };
}

function mapCampaign(row: typeof tables.campaigns.$inferSelect): Campaign {
  return {
    id: row.id,
    name: row.name,
    offerId: row.offerId,
    platform: row.platform as Platform,
    externalId: row.externalId,
    status: row.status as Campaign["status"],
    dailyBudget: row.dailyBudget,
    bid: row.bid,
    targeting: row.targeting as Campaign["targeting"],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapRule(row: typeof tables.rules.$inferSelect): AutomationRule {
  return {
    id: row.id,
    name: row.name,
    enabled: row.enabled,
    campaignIds: row.campaignIds as AutomationRule["campaignIds"],
    metric: row.metric as AutomationRule["metric"],
    operator: row.operator as AutomationRule["operator"],
    threshold: row.threshold,
    lookbackHours: row.lookbackHours,
    minSpend: row.minSpend ?? undefined,
    action: row.action as AutomationRule["action"],
    actionValue: row.actionValue ?? undefined,
    cooldownMinutes: row.cooldownMinutes,
    lastFiredAt: row.lastFiredAt ?? undefined,
    createdAt: row.createdAt,
  };
}

function mapExecution(row: typeof tables.executions.$inferSelect): RuleExecution {
  return {
    id: row.id,
    ruleId: row.ruleId,
    campaignId: row.campaignId,
    action: row.action as RuleExecution["action"],
    metricValue: row.metricValue,
    threshold: row.threshold,
    message: row.message,
    executedAt: row.executedAt,
  };
}

function mapConversion(row: typeof tables.conversions.$inferSelect): Conversion {
  return {
    id: row.id,
    campaignId: row.campaignId,
    offerId: row.offerId,
    clickId: row.clickId,
    payout: row.payout,
    occurredAt: row.occurredAt,
    source: row.source as Conversion["source"],
  };
}

function mapSpend(row: typeof tables.spendEvents.$inferSelect): SpendEvent {
  return {
    id: row.id,
    campaignId: row.campaignId,
    impressions: row.impressions,
    clicks: row.clicks,
    spend: row.spend,
    occurredAt: row.occurredAt,
  };
}

export async function listOffers(): Promise<Offer[]> {
  await ready();
  const rows = await getDb().select().from(tables.offers);
  return rows.map(mapOffer);
}

export async function listCampaigns(): Promise<Campaign[]> {
  await ready();
  const rows = await getDb().select().from(tables.campaigns);
  return rows.map(mapCampaign);
}

export async function getCampaign(id: string): Promise<Campaign | undefined> {
  await ready();
  const rows = await getDb()
    .select()
    .from(tables.campaigns)
    .where(eq(tables.campaigns.id, id))
    .limit(1);
  return rows[0] ? mapCampaign(rows[0]) : undefined;
}

export async function getOffer(id: string): Promise<Offer | undefined> {
  await ready();
  const rows = await getDb()
    .select()
    .from(tables.offers)
    .where(eq(tables.offers.id, id))
    .limit(1);
  return rows[0] ? mapOffer(rows[0]) : undefined;
}

export async function listRules(): Promise<AutomationRule[]> {
  await ready();
  const rows = await getDb().select().from(tables.rules);
  return rows.map(mapRule);
}

export async function listExecutions(limit = 50): Promise<RuleExecution[]> {
  await ready();
  const rows = await getDb()
    .select()
    .from(tables.executions)
    .orderBy(desc(tables.executions.executedAt))
    .limit(limit);
  return rows.map(mapExecution);
}

export async function listConversions(campaignId?: string): Promise<Conversion[]> {
  await ready();
  const db = getDb();
  const rows = campaignId
    ? await db
        .select()
        .from(tables.conversions)
        .where(eq(tables.conversions.campaignId, campaignId))
    : await db.select().from(tables.conversions);
  return rows.map(mapConversion);
}

export async function listSpendEvents(campaignId?: string): Promise<SpendEvent[]> {
  await ready();
  const db = getDb();
  const rows = campaignId
    ? await db
        .select()
        .from(tables.spendEvents)
        .where(eq(tables.spendEvents.campaignId, campaignId))
    : await db.select().from(tables.spendEvents);
  return rows.map(mapSpend);
}

export async function upsertCampaign(campaign: Campaign): Promise<Campaign> {
  await ready();
  const db = getDb();
  const values = {
    id: campaign.id,
    name: campaign.name,
    offerId: campaign.offerId,
    platform: campaign.platform,
    externalId: campaign.externalId,
    status: campaign.status,
    dailyBudget: campaign.dailyBudget,
    bid: campaign.bid,
    targeting: campaign.targeting,
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt,
  };
  await db
    .insert(tables.campaigns)
    .values(values)
    .onConflictDoUpdate({
      target: tables.campaigns.id,
      set: {
        name: values.name,
        offerId: values.offerId,
        platform: values.platform,
        externalId: values.externalId,
        status: values.status,
        dailyBudget: values.dailyBudget,
        bid: values.bid,
        targeting: values.targeting,
        updatedAt: values.updatedAt,
      },
    });
  return campaign;
}

export async function addConversion(conversion: Conversion): Promise<Conversion> {
  await ready();
  await getDb().insert(tables.conversions).values(conversion);
  return conversion;
}

export async function addSpendEvent(event: SpendEvent): Promise<SpendEvent> {
  await ready();
  await getDb().insert(tables.spendEvents).values(event);
  return event;
}

export async function addExecution(execution: RuleExecution): Promise<RuleExecution> {
  await ready();
  const db = getDb();
  await db.insert(tables.executions).values(execution);
  await db
    .update(tables.rules)
    .set({ lastFiredAt: execution.executedAt })
    .where(eq(tables.rules.id, execution.ruleId));
  return execution;
}

export async function updateRule(rule: AutomationRule): Promise<AutomationRule> {
  await ready();
  await getDb()
    .insert(tables.rules)
    .values({
      id: rule.id,
      name: rule.name,
      enabled: rule.enabled,
      campaignIds: rule.campaignIds,
      metric: rule.metric,
      operator: rule.operator,
      threshold: rule.threshold,
      lookbackHours: rule.lookbackHours,
      minSpend: rule.minSpend ?? null,
      action: rule.action,
      actionValue: rule.actionValue ?? null,
      cooldownMinutes: rule.cooldownMinutes,
      lastFiredAt: rule.lastFiredAt ?? null,
      createdAt: rule.createdAt,
    })
    .onConflictDoUpdate({
      target: tables.rules.id,
      set: {
        name: rule.name,
        enabled: rule.enabled,
        campaignIds: rule.campaignIds,
        metric: rule.metric,
        operator: rule.operator,
        threshold: rule.threshold,
        lookbackHours: rule.lookbackHours,
        minSpend: rule.minSpend ?? null,
        action: rule.action,
        actionValue: rule.actionValue ?? null,
        cooldownMinutes: rule.cooldownMinutes,
        lastFiredAt: rule.lastFiredAt ?? null,
      },
    });
  return rule;
}

export async function addPlatformSyncLog(entry: {
  platform: Platform;
  campaignId: string;
  action: string;
  detail: string;
  ok: boolean;
}) {
  await ready();
  await getDb().insert(tables.platformSyncLogs).values({
    id: createId("sync"),
    at: new Date().toISOString(),
    ...entry,
  });
}

export async function listPlatformSyncLogs(limit = 30) {
  await ready();
  return getDb()
    .select()
    .from(tables.platformSyncLogs)
    .orderBy(desc(tables.platformSyncLogs.at))
    .limit(limit);
}

export async function resetStore() {
  await ready();
  const db = getDb();
  // Order matters if FKs are added later; truncate all demo tables.
  await db.delete(tables.platformSyncLogs);
  await db.delete(tables.executions);
  await db.delete(tables.spendEvents);
  await db.delete(tables.conversions);
  await db.delete(tables.rules);
  await db.delete(tables.campaigns);
  await db.delete(tables.offers);
  await insertSnapshot(createSeedData());
  return {
    offers: await listOffers(),
    campaigns: await listCampaigns(),
    rules: await listRules(),
  };
}
