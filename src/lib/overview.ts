import { computeCampaignMetrics } from "@/lib/metrics";
import { metaConfigStatus } from "@/lib/platforms";
import { usingNeon } from "@/lib/db/client";
import {
  getOffer,
  listCampaigns,
  listConversions,
  listExecutions,
  listOffers,
  listPlatformSyncLogs,
  listRules,
  listSpendEvents,
} from "@/lib/store";

export async function getOverview() {
  const campaigns = await listCampaigns();
  const spendEvents = await listSpendEvents();
  const conversions = await listConversions();
  const since = new Date(Date.now() - 24 * 3600_000);

  const rows = await Promise.all(
    campaigns.map(async (campaign) => {
      const metrics = computeCampaignMetrics(
        campaign.id,
        spendEvents,
        conversions,
        since,
      );
      const offer = await getOffer(campaign.offerId);
      return { campaign, offer, metrics };
    }),
  );

  const totals = rows.reduce(
    (acc, row) => {
      acc.spend += row.metrics.spend;
      acc.revenue += row.metrics.revenue;
      acc.conversions += row.metrics.conversions;
      acc.clicks += row.metrics.clicks;
      return acc;
    },
    { spend: 0, revenue: 0, conversions: 0, clicks: 0 },
  );

  return {
    totals: {
      ...totals,
      spend: round2(totals.spend),
      revenue: round2(totals.revenue),
      roi:
        totals.spend > 0
          ? round2(((totals.revenue - totals.spend) / totals.spend) * 100)
          : null,
      activeCampaigns: campaigns.filter((c) => c.status === "active").length,
      pausedCampaigns: campaigns.filter((c) => c.status === "paused").length,
    },
    campaigns: rows,
    offers: await listOffers(),
    rules: await listRules(),
    executions: await listExecutions(25),
    syncLogs: await listPlatformSyncLogs(15),
    infra: {
      database: usingNeon() ? ("neon" as const) : ("pglite" as const),
      meta: metaConfigStatus(),
    },
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export type Overview = Awaited<ReturnType<typeof getOverview>>;
