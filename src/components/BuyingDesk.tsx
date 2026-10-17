"use client";

import { useState, useTransition } from "react";
import { money, num, pct, relativeTime } from "@/lib/format";
import type { Overview } from "@/lib/overview";
import type { Campaign, RuleExecution } from "@/lib/types";

export function BuyingDesk({ initialData }: { initialData: Overview }) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function refresh() {
    const res = await fetch("/api/overview", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load desk");
    setData((await res.json()) as Overview);
  }

  function run(fallback: string, fn: () => Promise<string | void>) {
    setMessage(null);
    setError(null);
    startTransition(() => {
      void (async () => {
        try {
          const custom = await fn();
          await refresh();
          setMessage(custom || fallback);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Action failed");
        }
      })();
    });
  }

  const { totals, campaigns, offers, rules, executions } = data;

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-6 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight">
            Performance · 24h
          </h1>
          <p className="mt-1 text-sm text-fog">
            {totals.activeCampaigns} active · {totals.pausedCampaigns} paused ·{" "}
            {offers.length} offers
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionButton
            disabled={pending}
            onClick={() =>
              run("Simulated winner traffic", async () => {
                await post("/api/simulate", { aggression: "winner", hours: 2 });
              })
            }
          >
            Simulate winners
          </ActionButton>
          <ActionButton
            disabled={pending}
            onClick={() =>
              run("Simulated loser traffic", async () => {
                await post("/api/simulate", { aggression: "loser", hours: 2 });
              })
            }
          >
            Simulate losers
          </ActionButton>
          <ActionButton
            primary
            disabled={pending}
            onClick={() =>
              run("Rules evaluated", async () => {
                const result = await post<{ fired: RuleExecution[] }>(
                  "/api/rules/evaluate",
                );
                return result.fired.length
                  ? `Fired ${result.fired.length} action(s)`
                  : "Rules evaluated — nothing to fire";
              })
            }
          >
            Run rules now
          </ActionButton>
          <ActionButton
            disabled={pending}
            onClick={() =>
              run("Demo data reset", async () => {
                await post("/api/reset");
              })
            }
          >
            Reset demo
          </ActionButton>
        </div>
      </div>

      {(message || error) && (
        <p
          className={`font-mono text-xs ${error ? "text-danger" : "text-lime"}`}
        >
          {error ?? message}
        </p>
      )}

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Spend" value={money(totals.spend)} />
        <Stat label="Revenue" value={money(totals.revenue)} />
        <Stat label="ROI" value={pct(totals.roi)} accent={totals.roi} />
        <Stat label="Conversions" value={num(totals.conversions)} />
      </section>

      <section>
        <h2 className="mb-4 font-[family-name:var(--font-syne)] text-xl font-bold">
          Campaigns
        </h2>
        <div className="overflow-x-auto border-y border-ink-line">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="font-mono text-[10px] uppercase tracking-[0.14em] text-fog">
                <th className="py-3 pr-4 font-medium">Campaign</th>
                <th className="py-3 pr-4 font-medium">Status</th>
                <th className="py-3 pr-4 font-medium">Spend</th>
                <th className="py-3 pr-4 font-medium">Revenue</th>
                <th className="py-3 pr-4 font-medium">CPA</th>
                <th className="py-3 pr-4 font-medium">ROI</th>
                <th className="py-3 font-medium">Budget</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(({ campaign, offer, metrics }) => (
                <tr key={campaign.id} className="border-t border-ink-line/80">
                  <td className="py-3.5 pr-4">
                    <div className="font-medium text-paper">{campaign.name}</div>
                    <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-fog">
                      {campaign.platform} · {offer?.name ?? campaign.offerId}
                    </div>
                  </td>
                  <td className="py-3.5 pr-4">
                    <StatusPill status={campaign.status} />
                  </td>
                  <td className="py-3.5 pr-4 font-mono text-xs">
                    {money(metrics.spend)}
                  </td>
                  <td className="py-3.5 pr-4 font-mono text-xs">
                    {money(metrics.revenue)}
                  </td>
                  <td className="py-3.5 pr-4 font-mono text-xs">
                    {metrics.cpa != null ? money(metrics.cpa) : "—"}
                  </td>
                  <td
                    className={`py-3.5 pr-4 font-mono text-xs ${
                      (metrics.roi ?? 0) >= 0 ? "text-good" : "text-danger"
                    }`}
                  >
                    {pct(metrics.roi)}
                  </td>
                  <td className="py-3.5 font-mono text-xs">
                    {money(campaign.dailyBudget)}/d
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 font-[family-name:var(--font-syne)] text-xl font-bold">
            Automation rules
          </h2>
          <ul className="space-y-4">
            {rules.map((rule) => (
              <li key={rule.id} className="border-t border-ink-line pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{rule.name}</p>
                    <p className="mt-1 font-mono text-[11px] text-fog">
                      {rule.metric} {rule.operator} {rule.threshold} ·{" "}
                      {rule.lookbackHours}h lookback · {rule.action}
                      {rule.actionValue != null ? ` ×${rule.actionValue}` : ""}
                    </p>
                  </div>
                  <span
                    className={`font-mono text-[10px] uppercase tracking-wide ${
                      rule.enabled ? "text-lime" : "text-fog"
                    }`}
                  >
                    {rule.enabled ? "On" : "Off"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-4 font-[family-name:var(--font-syne)] text-xl font-bold">
            Rule ledger
          </h2>
          {executions.length === 0 ? (
            <p className="border-t border-ink-line pt-4 text-sm text-fog">
              No actions yet. Simulate traffic, then run rules.
            </p>
          ) : (
            <ul className="space-y-3">
              {executions.map((exec) => (
                <li
                  key={exec.id}
                  className="border-t border-ink-line pt-3 font-mono text-[11px] leading-relaxed text-fog"
                >
                  <span className="text-lime">{relativeTime(exec.executedAt)}</span>
                  {" · "}
                  {exec.message}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="border-t border-ink-line pt-8 pb-4">
        <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">
          Postback
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-fog">
          Point your affiliate network S2S postback at{" "}
          <code className="font-mono text-xs text-lime">
            /api/postback?campaign_id=&#123;id&#125;&amp;click_id=&#123;clickid&#125;&amp;payout=&#123;payout&#125;
          </code>
        </p>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: number | null;
}) {
  const color =
    accent == null
      ? "text-paper"
      : accent >= 0
        ? "text-good"
        : "text-danger";
  return (
    <div className="border-t border-ink-line pt-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fog">
        {label}
      </p>
      <p
        className={`mt-2 font-[family-name:var(--font-syne)] text-3xl font-bold ${color}`}
      >
        {value}
      </p>
    </div>
  );
}

function StatusPill({ status }: { status: Campaign["status"] }) {
  const color =
    status === "active"
      ? "text-lime"
      : status === "paused"
        ? "text-warn"
        : "text-fog";
  return (
    <span className={`font-mono text-[10px] uppercase tracking-wide ${color}`}>
      {status}
    </span>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] transition-opacity disabled:opacity-40 ${
        primary
          ? "bg-lime text-ink hover:opacity-90"
          : "border border-ink-line text-fog hover:border-fog hover:text-paper"
      }`}
    >
      {children}
    </button>
  );
}

async function post<T = unknown>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      typeof err === "object" && err && "error" in err
        ? String((err as { error: string }).error)
        : `Request failed (${res.status})`,
    );
  }
  return (await res.json()) as T;
}
