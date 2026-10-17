import type { Campaign, Platform } from "@/lib/types";

export interface PlatformAdapter {
  platform: Platform;
  /**
   * Push local campaign state (status/budget/bid) to the ad network.
   * MVP uses a mock that records the intent.
   */
  syncCampaign(campaign: Campaign): Promise<{ ok: true; externalId: string } | { ok: false; error: string }>;
  fetchInsights(
    externalId: string,
    since: Date,
  ): Promise<{
    impressions: number;
    clicks: number;
    spend: number;
  }>;
}

export interface PlatformSyncLog {
  at: string;
  platform: Platform;
  campaignId: string;
  action: string;
  detail: string;
}
