export type Platform = "meta" | "google" | "tiktok" | "native";

export type CampaignStatus = "active" | "paused" | "draft" | "ended";

export type RuleActionType =
  | "pause_campaign"
  | "resume_campaign"
  | "scale_budget"
  | "reduce_budget"
  | "notify";

export type RuleMetric =
  | "cpa"
  | "roi"
  | "spend"
  | "conversions"
  | "ctr"
  | "epc";

export type RuleOperator = "gt" | "gte" | "lt" | "lte" | "eq";

export interface Offer {
  id: string;
  name: string;
  vertical: string;
  network: string;
  payout: number;
  currency: string;
  trackingUrl: string;
  status: "active" | "paused";
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  offerId: string;
  platform: Platform;
  externalId: string;
  status: CampaignStatus;
  dailyBudget: number;
  bid: number;
  targeting: {
    geos: string[];
    devices: string[];
    ageMin?: number;
    ageMax?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Conversion {
  id: string;
  campaignId: string;
  offerId: string;
  clickId: string;
  payout: number;
  occurredAt: string;
  source: "postback" | "pixel" | "manual";
}

export interface SpendEvent {
  id: string;
  campaignId: string;
  impressions: number;
  clicks: number;
  spend: number;
  occurredAt: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  campaignIds: string[] | "*";
  metric: RuleMetric;
  operator: RuleOperator;
  threshold: number;
  lookbackHours: number;
  minSpend?: number;
  action: RuleActionType;
  actionValue?: number; // e.g. scale multiplier 1.2 or reduce to 0.8
  cooldownMinutes: number;
  lastFiredAt?: string;
  createdAt: string;
}

export interface RuleExecution {
  id: string;
  ruleId: string;
  campaignId: string;
  action: RuleActionType;
  metricValue: number;
  threshold: number;
  message: string;
  executedAt: string;
}

export interface CampaignMetrics {
  campaignId: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
  cpa: number | null;
  roi: number | null;
  ctr: number;
  epc: number | null;
}

export interface StoreSnapshot {
  offers: Offer[];
  campaigns: Campaign[];
  conversions: Conversion[];
  spendEvents: SpendEvent[];
  rules: AutomationRule[];
  executions: RuleExecution[];
}
