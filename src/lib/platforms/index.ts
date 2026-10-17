import type { Campaign, Platform } from "@/lib/types";
import { createMockAdapter } from "@/lib/platforms/mock";
import { isMetaConfigured, metaAdapter } from "@/lib/platforms/meta";
import type { PlatformAdapter } from "@/lib/platforms/types";

const mockAdapters: Record<Platform, PlatformAdapter> = {
  meta: createMockAdapter("meta"),
  google: createMockAdapter("google"),
  tiktok: createMockAdapter("tiktok"),
  native: createMockAdapter("native"),
};

export function getAdapter(platform: Platform): PlatformAdapter {
  if (platform === "meta" && isMetaConfigured()) {
    return metaAdapter;
  }
  return mockAdapters[platform];
}

export async function syncCampaignToPlatform(campaign: Campaign) {
  return getAdapter(campaign.platform).syncCampaign(campaign);
}

export { isMetaConfigured, metaConfigStatus } from "@/lib/platforms/meta";
