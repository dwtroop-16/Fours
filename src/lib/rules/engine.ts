import { createId } from "@/lib/id";
import { computeCampaignMetrics, metricValue } from "@/lib/metrics";
import { conditionMet } from "@/lib/rules/compare";
import {
  addExecution,
  getCampaign,
  getOffer,
  listCampaigns,
  listConversions,
  listRules,
  listSpendEvents,
  upsertCampaign,
} from "@/lib/store";
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
  const elapsed = Date.now() - new Date(rule.lastFiredAt).getTime();
  return elapsed < rule.cooldownMinutes * 60_000;
}

async function resolveThreshold(
  rule: AutomationRule,
  campaign: Campaign,
): Promise<number> {
  if (rule.metric === "cpa" && rule.id.includes("high_cpa")) {
    const offer = await getOffer(campaign.offerId);
    if (offer) return Math.round(offer.payout * 1.2 * 100) / 100;
  }
  return rule.threshold;
}

export async function applyAction(
  rule: AutomationRule,
  campaign: Campaign,
  metrics: CampaignMetrics,
  threshold: number,
): Promise<RuleExecution> {
  const now = new Date().toISOString();
  let message = "";
  const live = (await getCampaign(campaign.id)) ?? campaign;
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

  await upsertCampaign(next);

  return addExecution({
    id: createId("exec"),
    ruleId: rule.id,
    campaignId: live.id,
    action: rule.action,
    metricValue: Number(metrics[rule.metric] ?? 0),
    threshold,
    message,
    executedAt: now,
  });
}

export async function evaluateRules(options?: {
  now?: Date;
}): Promise<EvaluationResult> {
  const now = options?.now ?? new Date();
  const rules = (await listRules()).filter((r) => r.enabled);
  const campaignIds = (await listCampaigns())
    .filter((c) => c.status !== "draft")
    .map((c) => c.id);
  const spendEvents = await listSpendEvents();
  const conversions = await listConversions();

  const fired: RuleExecution[] = [];
  const skipped: EvaluationResult["skipped"] = [];
  let checked = 0;

  for (const rule of rules) {
    if (inCooldown(rule)) {
      skipped.push({ ruleId: rule.id, campaignId: "*", reason: "cooldown" });
      continue;
    }

    const since = new Date(now.getTime() - rule.lookbackHours * 3600_000);

    for (const id of campaignIds) {
      const campaign = await getCampaign(id);
      if (!campaign) continue;
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

      const threshold = await resolveThreshold(rule, campaign);
      if (!conditionMet(rule.operator, value, threshold)) {
        skipped.push({
          ruleId: rule.id,
          campaignId: campaign.id,
          reason: "condition_false",
        });
        continue;
      }

      fired.push(await applyAction(rule, campaign, metrics, threshold));
    }
  }

  return { checked, fired, skipped };
}

export { conditionMet } from "@/lib/rules/compare";
