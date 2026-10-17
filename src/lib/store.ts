import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { createSeedData } from "@/lib/seed";
import type {
  AutomationRule,
  Campaign,
  Conversion,
  Offer,
  RuleExecution,
  SpendEvent,
  StoreSnapshot,
} from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

type GlobalStore = {
  __foursStore?: StoreSnapshot;
};

function getGlobal(): GlobalStore {
  return globalThis as unknown as GlobalStore;
}

function loadFromDisk(): StoreSnapshot | null {
  try {
    if (!existsSync(STORE_PATH)) return null;
    const raw = readFileSync(STORE_PATH, "utf8");
    return JSON.parse(raw) as StoreSnapshot;
  } catch {
    return null;
  }
}

function persist(snapshot: StoreSnapshot): void {
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(STORE_PATH, JSON.stringify(snapshot, null, 2));
  } catch {
    // Local demo persistence is best-effort (e.g. read-only deploys).
  }
}

export function getStore(): StoreSnapshot {
  const g = getGlobal();
  if (!g.__foursStore) {
    g.__foursStore = loadFromDisk() ?? createSeedData();
    persist(g.__foursStore);
  }
  return g.__foursStore;
}

export function saveStore(mutator: (store: StoreSnapshot) => void): StoreSnapshot {
  const store = getStore();
  mutator(store);
  persist(store);
  return store;
}

export function resetStore(): StoreSnapshot {
  const g = getGlobal();
  g.__foursStore = createSeedData();
  persist(g.__foursStore);
  return g.__foursStore;
}

export function listOffers(): Offer[] {
  return getStore().offers;
}

export function listCampaigns(): Campaign[] {
  return getStore().campaigns;
}

export function getCampaign(id: string): Campaign | undefined {
  return getStore().campaigns.find((c) => c.id === id);
}

export function getOffer(id: string): Offer | undefined {
  return getStore().offers.find((o) => o.id === id);
}

export function listRules(): AutomationRule[] {
  return getStore().rules;
}

export function listExecutions(limit = 50): RuleExecution[] {
  return [...getStore().executions]
    .sort((a, b) => b.executedAt.localeCompare(a.executedAt))
    .slice(0, limit);
}

export function listConversions(campaignId?: string): Conversion[] {
  const all = getStore().conversions;
  return campaignId ? all.filter((c) => c.campaignId === campaignId) : all;
}

export function listSpendEvents(campaignId?: string): SpendEvent[] {
  const all = getStore().spendEvents;
  return campaignId ? all.filter((e) => e.campaignId === campaignId) : all;
}

export function upsertCampaign(campaign: Campaign): Campaign {
  saveStore((store) => {
    const idx = store.campaigns.findIndex((c) => c.id === campaign.id);
    if (idx >= 0) store.campaigns[idx] = campaign;
    else store.campaigns.push(campaign);
  });
  return campaign;
}

export function addConversion(conversion: Conversion): Conversion {
  saveStore((store) => {
    store.conversions.push(conversion);
  });
  return conversion;
}

export function addSpendEvent(event: SpendEvent): SpendEvent {
  saveStore((store) => {
    store.spendEvents.push(event);
  });
  return event;
}

export function addExecution(execution: RuleExecution): RuleExecution {
  saveStore((store) => {
    store.executions.unshift(execution);
    const rule = store.rules.find((r) => r.id === execution.ruleId);
    if (rule) rule.lastFiredAt = execution.executedAt;
  });
  return execution;
}

export function updateRule(rule: AutomationRule): AutomationRule {
  saveStore((store) => {
    const idx = store.rules.findIndex((r) => r.id === rule.id);
    if (idx >= 0) store.rules[idx] = rule;
    else store.rules.push(rule);
  });
  return rule;
}
