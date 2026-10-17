import type {
  CampaignMetrics,
  Conversion,
  SpendEvent,
} from "@/lib/types";

export function computeCampaignMetrics(
  campaignId: string,
  spendEvents: SpendEvent[],
  conversions: Conversion[],
  since?: Date,
): CampaignMetrics {
  const inWindow = (iso: string) =>
    !since || new Date(iso).getTime() >= since.getTime();

  const spend = spendEvents.filter(
    (e) => e.campaignId === campaignId && inWindow(e.occurredAt),
  );
  const convs = conversions.filter(
    (c) => c.campaignId === campaignId && inWindow(c.occurredAt),
  );

  const impressions = spend.reduce((s, e) => s + e.impressions, 0);
  const clicks = spend.reduce((s, e) => s + e.clicks, 0);
  const totalSpend = spend.reduce((s, e) => s + e.spend, 0);
  const conversionCount = convs.length;
  const revenue = convs.reduce((s, c) => s + c.payout, 0);

  return {
    campaignId,
    impressions,
    clicks,
    spend: round2(totalSpend),
    conversions: conversionCount,
    revenue: round2(revenue),
    cpa: conversionCount > 0 ? round2(totalSpend / conversionCount) : null,
    roi:
      totalSpend > 0 ? round2(((revenue - totalSpend) / totalSpend) * 100) : null,
    ctr: impressions > 0 ? round2((clicks / impressions) * 100) : 0,
    epc: clicks > 0 ? round2(revenue / clicks) : null,
  };
}

export function metricValue(
  metrics: CampaignMetrics,
  metric: keyof Pick<
    CampaignMetrics,
    "cpa" | "roi" | "spend" | "conversions" | "ctr" | "epc"
  >,
): number | null {
  return metrics[metric];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
