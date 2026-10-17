import { NextRequest, NextResponse } from "next/server";
import { syncCampaignToPlatform } from "@/lib/platforms";
import { evaluateRules } from "@/lib/rules/engine";
import { getCampaign } from "@/lib/store";

/**
 * Vercel Cron entrypoint — evaluate automation rules on a schedule.
 * Secured with Authorization: Bearer $CRON_SECRET (or ?secret=).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    const querySecret = req.nextUrl.searchParams.get("secret");
    if (bearer !== secret && querySecret !== secret) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  const result = await evaluateRules();
  const synced = [];
  for (const exec of result.fired) {
    const campaign = await getCampaign(exec.campaignId);
    if (!campaign) continue;
    synced.push({
      campaignId: campaign.id,
      sync: await syncCampaignToPlatform(campaign),
    });
  }

  return NextResponse.json({
    ok: true,
    at: new Date().toISOString(),
    checked: result.checked,
    fired: result.fired.length,
    synced,
    executions: result.fired,
  });
}
