import { NextResponse } from "next/server";
import { syncCampaignToPlatform } from "@/lib/platforms";
import { evaluateRules } from "@/lib/rules/engine";
import { getCampaign } from "@/lib/store";

export async function POST() {
  const result = await evaluateRules();

  const synced = [];
  for (const exec of result.fired) {
    const campaign = await getCampaign(exec.campaignId);
    if (!campaign) continue;
    const sync = await syncCampaignToPlatform(campaign);
    synced.push({ campaignId: campaign.id, sync });
  }

  return NextResponse.json({ ...result, synced });
}
