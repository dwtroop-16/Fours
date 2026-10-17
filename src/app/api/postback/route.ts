import { NextRequest, NextResponse } from "next/server";
import { createId } from "@/lib/id";
import { addConversion, getCampaign, getOffer } from "@/lib/store";

/**
 * S2S postback endpoint.
 * Example: /api/postback?campaign_id=camp_x&click_id=abc&payout=45
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const campaignId = params.get("campaign_id") ?? params.get("cid");
  const clickId =
    params.get("click_id") ?? params.get("clickid") ?? createId("clk");
  const payoutParam = params.get("payout") ?? params.get("amount");

  if (!campaignId) {
    return NextResponse.json(
      { ok: false, error: "campaign_id is required" },
      { status: 400 },
    );
  }

  const campaign = await getCampaign(campaignId);
  if (!campaign) {
    return NextResponse.json(
      { ok: false, error: "unknown campaign" },
      { status: 404 },
    );
  }

  const offer = await getOffer(campaign.offerId);
  const payout = payoutParam ? Number(payoutParam) : (offer?.payout ?? 0);
  if (!Number.isFinite(payout) || payout < 0) {
    return NextResponse.json(
      { ok: false, error: "invalid payout" },
      { status: 400 },
    );
  }

  const conversion = await addConversion({
    id: createId("conv"),
    campaignId,
    offerId: campaign.offerId,
    clickId,
    payout,
    occurredAt: new Date().toISOString(),
    source: "postback",
  });

  return NextResponse.json({ ok: true, conversion });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, string>;
  const url = req.nextUrl.clone();
  for (const [k, v] of Object.entries(body)) {
    if (v != null) url.searchParams.set(k, String(v));
  }
  return GET(new NextRequest(url));
}
