import type { Campaign, Platform } from "@/lib/types";
import type { PlatformAdapter } from "@/lib/platforms/types";
import { addPlatformSyncLog } from "@/lib/store";

export function createMockAdapter(platform: Platform): PlatformAdapter {
  return {
    platform,
    async syncCampaign(campaign: Campaign) {
      await addPlatformSyncLog({
        platform,
        campaignId: campaign.id,
        action: "sync",
        detail: `status=${campaign.status} budget=${campaign.dailyBudget} bid=${campaign.bid}`,
        ok: true,
      });
      return { ok: true, externalId: campaign.externalId };
    },
    async fetchInsights(externalId: string) {
      const seed = externalId.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
      const spend = 8 + (seed % 17);
      const clicks = 10 + (seed % 40);
      const impressions = clicks * (40 + (seed % 30));
      return { impressions, clicks, spend };
    },
  };
}
