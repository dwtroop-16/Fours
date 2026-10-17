import type { StoreSnapshot } from "@/lib/types";

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3600_000).toISOString();

export function createSeedData(): StoreSnapshot {
  return {
    offers: [
      {
        id: "offer_weightloss_us",
        name: "LeanPath US — Trial",
        vertical: "nutra",
        network: "MaxBounty",
        payout: 45,
        currency: "USD",
        trackingUrl: "https://track.example.com/click?offer=leanpath&cid={click_id}",
        status: "active",
        createdAt: hoursAgo(72),
      },
      {
        id: "offer_finance_ca",
        name: "CreditBoost CA — CPL",
        vertical: "finance",
        network: "CJ Affiliate",
        payout: 28,
        currency: "USD",
        trackingUrl: "https://track.example.com/click?offer=creditboost&cid={click_id}",
        status: "active",
        createdAt: hoursAgo(48),
      },
      {
        id: "offer_dating_uk",
        name: "SparkMatch UK — DOI",
        vertical: "dating",
        network: "ClickBank",
        payout: 18,
        currency: "USD",
        trackingUrl: "https://track.example.com/click?offer=sparkmatch&cid={click_id}",
        status: "active",
        createdAt: hoursAgo(96),
      },
    ],
    campaigns: [
      {
        id: "camp_meta_lean_broad",
        name: "Meta · LeanPath Broad 25–54",
        offerId: "offer_weightloss_us",
        platform: "meta",
        externalId: "meta_act_1001",
        status: "active",
        dailyBudget: 250,
        bid: 1.85,
        targeting: { geos: ["US"], devices: ["mobile", "desktop"], ageMin: 25, ageMax: 54 },
        createdAt: hoursAgo(70),
        updatedAt: hoursAgo(2),
      },
      {
        id: "camp_meta_lean_lookalike",
        name: "Meta · LeanPath LAL 1%",
        offerId: "offer_weightloss_us",
        platform: "meta",
        externalId: "meta_act_1002",
        status: "active",
        dailyBudget: 180,
        bid: 2.1,
        targeting: { geos: ["US"], devices: ["mobile"], ageMin: 30, ageMax: 55 },
        createdAt: hoursAgo(50),
        updatedAt: hoursAgo(1),
      },
      {
        id: "camp_google_credit",
        name: "Google · CreditBoost Search",
        offerId: "offer_finance_ca",
        platform: "google",
        externalId: "gads_3001",
        status: "active",
        dailyBudget: 120,
        bid: 3.4,
        targeting: { geos: ["CA"], devices: ["mobile", "desktop"] },
        createdAt: hoursAgo(40),
        updatedAt: hoursAgo(3),
      },
      {
        id: "camp_tiktok_dating",
        name: "TikTok · SparkMatch Spark Ads",
        offerId: "offer_dating_uk",
        platform: "tiktok",
        externalId: "tt_9001",
        status: "active",
        dailyBudget: 90,
        bid: 0.95,
        targeting: { geos: ["UK"], devices: ["mobile"], ageMin: 21, ageMax: 35 },
        createdAt: hoursAgo(30),
        updatedAt: hoursAgo(4),
      },
    ],
    conversions: [
      ...seedConversions("camp_meta_lean_broad", "offer_weightloss_us", 45, 11, 24),
      ...seedConversions("camp_meta_lean_lookalike", "offer_weightloss_us", 45, 3, 18),
      ...seedConversions("camp_google_credit", "offer_finance_ca", 28, 8, 20),
      ...seedConversions("camp_tiktok_dating", "offer_dating_uk", 18, 14, 16),
    ],
    spendEvents: [
      ...seedSpend("camp_meta_lean_broad", 24, 9.5, 0.42, 48),
      // Losing campaign: high spend, few conversions
      ...seedSpend("camp_meta_lean_lookalike", 18, 14.2, 0.55, 62),
      ...seedSpend("camp_google_credit", 20, 6.8, 0.38, 41),
      ...seedSpend("camp_tiktok_dating", 16, 4.1, 0.28, 55),
    ],
    rules: [
      {
        id: "rule_pause_high_cpa",
        name: "Pause if CPA > payout × 1.2",
        enabled: true,
        campaignIds: "*",
        metric: "cpa",
        operator: "gt",
        threshold: 54, // 45 * 1.2 for nutra; engine also checks per-campaign context via absolute threshold
        lookbackHours: 24,
        minSpend: 40,
        action: "pause_campaign",
        cooldownMinutes: 60,
        createdAt: hoursAgo(60),
      },
      {
        id: "rule_scale_winners",
        name: "Scale budget +20% when ROI > 40%",
        enabled: true,
        campaignIds: "*",
        metric: "roi",
        operator: "gt",
        threshold: 40,
        lookbackHours: 24,
        minSpend: 30,
        action: "scale_budget",
        actionValue: 1.2,
        cooldownMinutes: 180,
        createdAt: hoursAgo(60),
      },
      {
        id: "rule_cut_bleeders",
        name: "Reduce budget −30% when ROI < −20%",
        enabled: true,
        campaignIds: "*",
        metric: "roi",
        operator: "lt",
        threshold: -20,
        lookbackHours: 12,
        minSpend: 25,
        action: "reduce_budget",
        actionValue: 0.7,
        cooldownMinutes: 120,
        createdAt: hoursAgo(60),
      },
    ],
    executions: [],
  };
}

function seedConversions(
  campaignId: string,
  offerId: string,
  payout: number,
  count: number,
  withinHours: number,
) {
  return Array.from({ length: count }, (_, i) => ({
    id: `conv_seed_${campaignId}_${i}`,
    campaignId,
    offerId,
    clickId: `clk_${campaignId}_${i}`,
    payout,
    occurredAt: hoursAgo(Math.random() * withinHours),
    source: "postback" as const,
  }));
}

function seedSpend(
  campaignId: string,
  withinHours: number,
  spendPerHour: number,
  cpc: number,
  ctrPct: number,
) {
  const events = [];
  for (let h = 0; h < withinHours; h++) {
    const spend = spendPerHour * (0.75 + Math.random() * 0.5);
    const clicks = Math.max(1, Math.round(spend / cpc));
    const impressions = Math.round(clicks / (ctrPct / 100));
    events.push({
      id: `spend_seed_${campaignId}_${h}`,
      campaignId,
      impressions,
      clicks,
      spend: Math.round(spend * 100) / 100,
      occurredAt: hoursAgo(h + Math.random()),
    });
  }
  return events;
}
