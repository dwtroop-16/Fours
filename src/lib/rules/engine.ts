import { createId } from "@/lib/id";
import { computeCampaignMetrics, metricValue } from "@/lib/metrics";
import {
  addExecution,
  getCampaign,
  getOffer,
  getStore,
  listCampaigns,
  listConversions,
  listRules,
  listSpendEvents,
  upsertCampaign,
} from "@/lib/store";
import { conditionMet } from "@/lib/rules/compare";
import type {
  AutomationRule,
  Campaign,
  CampaignMetrics,
  RuleExecution,
} from "@/lib/types";

export interface EvaluationResult {
  checked: number;
  fired: RuleExecution[];
  skipped: { ruleId: string; campaignId: string; reason: string }[];
}

function ruleAppliesToCampaign(rule: AutomationRule, campaignId: string): boolean {
  return rule.campaignIds === "*" || rule.campaignIds.includes(campaignId);
}

function inCooldown(rule: AutomationRule): boolean {
  if (!rule.lastFiredAt) return false;
  const elapsed =
    Date.now() - new Date(rule.lastFiredAt).getTime();
  return elapsed < rule.cooldownMinutes * 60_000;
}

function resolveThreshold(rule: AutomationRule, campaign: Campaign): number {
  // CPA rules often want relative-to-payout; if rule id hints pause_high_cpa, use offer payout * 1.2
  if (rule.metric === "cpa" && rule.id.includes("high_cpa")) {
    const offer = getOffer(campaign.offerId);
    if (offer) return Math.round(offer.payout * 1.2 * 100) / 100;
  }
  return rule.threshold;
}

export function applyAction(
  rule: AutomationRule,
  campaign: Campaign,
  metrics: CampaignMetrics,
  threshold: number,
): RuleExecution {
  const now = new Date().toISOString();
  let message = "";
  // Always merge onto the latest store row so earlier actions in this cycle are kept.
  const live = getCampaign(campaign.id) ?? campaign;
  const next = { ...live, updatedAt: now };

  switch (rule.action) {
    case "pause_campaign":
      next.status = "paused";
      message = `Paused ${live.name}: ${rule.metric}=${metrics[rule.metric]} exceeded pause threshold ${threshold}.`;
      break;
    case "resume_campaign":
      next.status = "active";
      message = `Resumed ${live.name}.`;
      break;
    case "scale_budget": {
      const mult = rule.actionValue ?? 1.2;
      const before = live.dailyBudget;
      next.dailyBudget = Math.round(before * mult * 100) / 100;
      message = `Scaled budget ${before} → ${next.dailyBudget} (${mult}x) on ${live.name}.`;
      break;
    }
    case "reduce_budget": {
      const mult = rule.actionValue ?? 0.7;
      const before = live.dailyBudget;
      next.dailyBudget = Math.max(10, Math.round(before * mult * 100) / 100);
      message = `Reduced budget ${before} → ${next.dailyBudget} on ${live.name}.`;
      break;
    }
    case "notify":
      message = `Alert on ${live.name}: ${rule.metric}=${metrics[rule.metric]} (threshold ${threshold}).`;
      break;
  }

  upsertCampaign(next);

  const execution: RuleExecution = {
    id: createId("exec"),
    ruleId: rule.id,
    campaignId: live.id,
    action: rule.action,
    metricValue: Number(metrics[rule.metric] ?? 0),
    threshold,
    message,
    executedAt: now,
  };
  return addExecution(execution);
}

export function evaluateRules(options?: {
  now?: Date;
}): EvaluationResult {
  const now = options?.now ?? new Date();
  const rules = listRules().filter((r) => r.enabled);
  const campaigns = listCampaigns().filter((c) => c.status !== "draft");
  const spendEvents = listSpendEvents();
  const conversions = listConversions();

  const fired: RuleExecution[] = [];
  const skipped: EvaluationResult["skipped"] = [];
  let checked = 0;

  for (const rule of rules) {
    if (inCooldown(rule)) {
      skipped.push({
        ruleId: rule.id,
        campaignId: "*",
        reason: "cooldown",
      });
      continue;
    }

    const since = new Date(now.getTime() - rule.lookbackHours * 3600_000);

    for (const snapshot of campaigns) {
      const campaign = getCampaign(snapshot.id) ?? snapshot;
      if (!ruleAppliesToCampaign(rule, campaign.id)) continue;
      if (campaign.status === "ended") continue;
      if (rule.action === "pause_campaign" && campaign.status === "paused") {
        skipped.push({
          ruleId: rule.id,
          campaignId: campaign.id,
          reason: "already_paused",
        });
        continue;
      }
      if (
        (rule.action === "scale_budget" || rule.action === "reduce_budget") &&
        campaign.status !== "active"
      ) {
        skipped.push({
          ruleId: rule.id,
          campaignId: campaign.id,
          reason: "not_active",
        });
        continue;
      }

      checked += 1;
      const metrics = computeCampaignMetrics(
        campaign.id,
        spendEvents,
        conversions,
        since,
      );

      if (rule.minSpend != null && metrics.spend < rule.minSpend) {
        skipped.push({
          ruleId: rule.id,
          campaignId: campaign.id,
          reason: "below_min_spend",
        });
        continue;
      }

      const value = metricValue(metrics, rule.metric);
      if (value == null) {
        skipped.push({
          ruleId: rule.id,
          campaignId: campaign.id,
          reason: "metric_unavailable",
        });
        continue;
      }

      const threshold = resolveThreshold(rule, campaign);
      if (!conditionMet(rule.operator, value, threshold)) {
        skipped.push({
          ruleId: rule.id,
          campaignId: campaign.id,
          reason: "condition_false",
        });
        continue;
      }

      fired.push(applyAction(rule, campaign, metrics, threshold));
    }
  }

  // Touch store so callers see latest
  getStore();
  return { checked, fired, skipped };
}

export { conditionMet } from "@/lib/rules/compare";
