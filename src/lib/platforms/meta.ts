import type { Campaign } from "@/lib/types";
import type { PlatformAdapter } from "@/lib/platforms/types";
import { addPlatformSyncLog } from "@/lib/store";

const GRAPH_VERSION = process.env.META_GRAPH_VERSION ?? "v22.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export function isMetaConfigured(): boolean {
  return Boolean(process.env.META_ACCESS_TOKEN);
}

export function metaConfigStatus() {
  return {
    configured: isMetaConfigured(),
    adAccountId: process.env.META_AD_ACCOUNT_ID ?? null,
    graphVersion: GRAPH_VERSION,
    mode: isMetaConfigured() ? ("live" as const) : ("mock" as const),
  };
}

async function graphPost(
  objectId: string,
  params: Record<string, string>,
): Promise<{ ok: true; body: unknown } | { ok: false; error: string }> {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) {
    return { ok: false, error: "META_ACCESS_TOKEN is not set" };
  }

  const body = new URLSearchParams({ ...params, access_token: token });
  const res = await fetch(`${GRAPH_BASE}/${objectId}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    error?: { message?: string };
  };

  if (!res.ok || json.error) {
    return {
      ok: false,
      error: json.error?.message ?? `Meta API HTTP ${res.status}`,
    };
  }

  return { ok: true, body: json };
}

/**
 * Sync local campaign status + daily budget to Meta.
 * `campaign.externalId` should be the Meta campaign ID (for status) when using
 * campaign budget optimization, or an ad set ID when budgets live on ad sets.
 * Optional META_BUDGET_OBJECT_ID_{campaignId} overrides the budget target.
 */
export const metaAdapter: PlatformAdapter = {
  platform: "meta",

  async syncCampaign(campaign: Campaign) {
    if (!isMetaConfigured()) {
      await addPlatformSyncLog({
        platform: "meta",
        campaignId: campaign.id,
        action: "sync_skipped",
        detail: "META_ACCESS_TOKEN missing — mock mode",
        ok: true,
      });
      return { ok: true, externalId: campaign.externalId };
    }

    const status =
      campaign.status === "active"
        ? "ACTIVE"
        : campaign.status === "paused"
          ? "PAUSED"
          : null;

    if (status) {
      const statusResult = await graphPost(campaign.externalId, { status });
      await addPlatformSyncLog({
        platform: "meta",
        campaignId: campaign.id,
        action: "set_status",
        detail: statusResult.ok
          ? `${campaign.externalId} → ${status}`
          : statusResult.error,
        ok: statusResult.ok,
      });
      if (!statusResult.ok) {
        return { ok: false, error: statusResult.error };
      }
    }

    const budgetObjectId =
      process.env[`META_BUDGET_OBJECT_${campaign.id}`] ?? campaign.externalId;
    // Meta expects daily_budget in the account's minor currency units (cents).
    const dailyBudgetCents = Math.round(campaign.dailyBudget * 100).toString();
    const budgetResult = await graphPost(budgetObjectId, {
      daily_budget: dailyBudgetCents,
    });

    await addPlatformSyncLog({
      platform: "meta",
      campaignId: campaign.id,
      action: "set_daily_budget",
      detail: budgetResult.ok
        ? `${budgetObjectId} → ${dailyBudgetCents} cents`
        : budgetResult.error,
      ok: budgetResult.ok,
    });

    if (!budgetResult.ok) {
      return { ok: false, error: budgetResult.error };
    }

    return { ok: true, externalId: campaign.externalId };
  },

  async fetchInsights(externalId: string, since: Date) {
    const token = process.env.META_ACCESS_TOKEN;
    if (!token) {
      return { impressions: 0, clicks: 0, spend: 0 };
    }

    const sinceStr = since.toISOString().slice(0, 10);
    const untilStr = new Date().toISOString().slice(0, 10);
    const url = new URL(`${GRAPH_BASE}/${externalId}/insights`);
    url.searchParams.set("access_token", token);
    url.searchParams.set("fields", "impressions,clicks,spend");
    url.searchParams.set("time_range", JSON.stringify({ since: sinceStr, until: untilStr }));

    const res = await fetch(url);
    const json = (await res.json().catch(() => ({}))) as {
      data?: { impressions?: string; clicks?: string; spend?: string }[];
      error?: { message?: string };
    };

    if (!res.ok || json.error || !json.data?.[0]) {
      return { impressions: 0, clicks: 0, spend: 0 };
    }

    const row = json.data[0];
    return {
      impressions: Number(row.impressions ?? 0),
      clicks: Number(row.clicks ?? 0),
      spend: Number(row.spend ?? 0),
    };
  },
};
