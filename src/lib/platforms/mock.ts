import type { Campaign, Platform } from "@/lib/types";
import type { PlatformAdapter, PlatformSyncLog } from "@/lib/platforms/types";

const syncLog: PlatformSyncLog[] = [];

export function getPlatformSyncLog(limit = 30): PlatformSyncLog[] {
  return syncLog.slice(0, limit);
}

function createMockAdapter(platform: Platform): PlatformAdapter {
  return {
    platform,
    async syncCampaign(campaign: Campaign) {
      syncLog.unshift({
        at: new Date().toISOString(),
        platform,
        campaignId: campaign.id,
        action: "sync",
        detail: `status=${campaign.status} budget=${campaign.dailyBudget} bid=${campaign.bid}`,
      });
      return { ok: true, externalId: campaign.externalId };
    },
    async fetchInsights(externalId: string) {
      // Deterministic-ish mock pull for demo wiring
      const seed = externalId.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
      const spend = 8 + (seed % 17);
      const clicks = 10 + (seed % 40);
      const impressions = clicks * (40 + (seed % 30));
      return { impressions, clicks, spend };
    },
  };
}

const adapters: Record<Platform, PlatformAdapter> = {
  meta: createMockAdapter("meta"),
  google: createMockAdapter("google"),
  tiktok: createMockAdapter("tiktok"),
  native: createMockAdapter("native"),
};

export function getAdapter(platform: Platform): PlatformAdapter {
  return adapters[platform];
}

export async function syncCampaignToPlatform(campaign: Campaign) {
  return getAdapter(campaign.platform).syncCampaign(campaign);
}
