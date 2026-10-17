import { NextResponse } from "next/server";
import { syncCampaignToPlatform } from "@/lib/platforms/mock";
import { evaluateRules } from "@/lib/rules/engine";
import { getCampaign } from "@/lib/store";


export async function POST() {
  const result = evaluateRules();

  // Push any mutated campaigns to mock platform adapters
  const synced = [];
  for (const exec of result.fired) {
    const campaign = getCampaign(exec.campaignId);
    if (!campaign) continue;
    const sync = await syncCampaignToPlatform(campaign);
    synced.push({ campaignId: campaign.id, sync });
  }

  return NextResponse.json({ ...result, synced });
}
