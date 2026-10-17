import { NextRequest, NextResponse } from "next/server";
import { syncCampaignToPlatform } from "@/lib/platforms";
import { getCampaign, upsertCampaign } from "@/lib/store";
import type { CampaignStatus } from "@/lib/types";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const campaign = await getCampaign(id);
  if (!campaign) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const body = (await req.json()) as {
    status?: CampaignStatus;
    dailyBudget?: number;
    bid?: number;
  };

  const next = {
    ...campaign,
    status: body.status ?? campaign.status,
    dailyBudget:
      body.dailyBudget != null ? Number(body.dailyBudget) : campaign.dailyBudget,
    bid: body.bid != null ? Number(body.bid) : campaign.bid,
    updatedAt: new Date().toISOString(),
  };

  await upsertCampaign(next);
  const sync = await syncCampaignToPlatform(next);
  return NextResponse.json({ campaign: next, sync });
}
