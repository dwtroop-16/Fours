import { NextRequest, NextResponse } from "next/server";
import { createId } from "@/lib/id";
import {
  addConversion,
  addSpendEvent,
  getOffer,
  listCampaigns,
} from "@/lib/store";

/**
 * Simulate a burst of traffic + optional conversions for demo / testing rules.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    campaignId?: string;
    hours?: number;
    aggression?: "winner" | "loser" | "neutral";
  };

  const campaigns = (await listCampaigns()).filter((c) => c.status === "active");
  const target = body.campaignId
    ? campaigns.filter((c) => c.id === body.campaignId)
    : campaigns;

  if (target.length === 0) {
    return NextResponse.json(
      { ok: false, error: "no active campaigns to simulate" },
      { status: 400 },
    );
  }

  const hours = Math.min(Math.max(body.hours ?? 1, 1), 12);
  const aggression = body.aggression ?? "neutral";
  const created = { spend: 0, conversions: 0 };

  for (const campaign of target) {
    const offer = await getOffer(campaign.offerId);
    const payout = offer?.payout ?? 20;

    for (let h = 0; h < hours; h++) {
      const baseSpend = campaign.dailyBudget / 24;
      const spendMult =
        aggression === "loser" ? 1.6 : aggression === "winner" ? 0.9 : 1;
      const spend =
        Math.round(
          baseSpend * spendMult * (0.8 + Math.random() * 0.4) * 100,
        ) / 100;
      const cpc = 0.35 + Math.random() * 0.9;
      const clicks = Math.max(1, Math.round(spend / cpc));
      const impressions = clicks * (35 + Math.floor(Math.random() * 40));

      await addSpendEvent({
        id: createId("spend"),
        campaignId: campaign.id,
        impressions,
        clicks,
        spend,
        occurredAt: new Date(Date.now() - h * 3600_000).toISOString(),
      });
      created.spend += 1;

      const convRate =
        aggression === "winner" ? 0.12 : aggression === "loser" ? 0.01 : 0.05;
      const convs =
        Math.random() < convRate * clicks
          ? Math.max(1, Math.round(clicks * convRate))
          : 0;
      for (let i = 0; i < convs; i++) {
        await addConversion({
          id: createId("conv"),
          campaignId: campaign.id,
          offerId: campaign.offerId,
          clickId: createId("clk"),
          payout,
          occurredAt: new Date(Date.now() - h * 3600_000).toISOString(),
          source: "postback",
        });
        created.conversions += 1;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    created,
    campaigns: target.map((c) => c.id),
  });
}
