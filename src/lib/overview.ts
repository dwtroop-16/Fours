import { computeCampaignMetrics } from "@/lib/metrics";
import {
  getOffer,
  listCampaigns,
  listConversions,
  listExecutions,
  listOffers,
  listRules,
  listSpendEvents,
} from "@/lib/store";

export function getOverview() {
  const campaigns = listCampaigns();
  const spendEvents = listSpendEvents();
  const conversions = listConversions();
  const since = new Date(Date.now() - 24 * 3600_000);

  const rows = campaigns.map((campaign) => {
    const metrics = computeCampaignMetrics(
      campaign.id,
      spendEvents,
      conversions,
      since,
    );
    const offer = getOffer(campaign.offerId);
    return { campaign, offer, metrics };
  });

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
    offers: listOffers(),
    rules: listRules(),
    executions: listExecutions(25),
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export type Overview = ReturnType<typeof getOverview>;
