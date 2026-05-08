"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import type { PrimaryUseCase, SpendAuditInput, ToolPlan } from "@/lib/tools";
import { runAudit } from "@/lib/auditEngine";
import { readLocalStorageJson, writeLocalStorageJson } from "@/lib/localStorage";

const STORAGE_KEY = "tokenleak:v1:audit_input";

type ToolRow = {
  enabled: boolean;
  tool: ToolPlan["tool"];
  plan: ToolPlan["plan"];
  monthlySpendUsd: number;
  seats: number;
};

const toolDefaults: ToolRow[] = [
  { enabled: false, tool: "cursor", plan: "pro", monthlySpendUsd: 0, seats: 1 },
  {
    enabled: false,
    tool: "github_copilot",
    plan: "individual",
    monthlySpendUsd: 0,
    seats: 1,
  },
  { enabled: false, tool: "claude", plan: "pro", monthlySpendUsd: 0, seats: 1 },
  { enabled: false, tool: "chatgpt", plan: "plus", monthlySpendUsd: 0, seats: 1 },
  {
    enabled: false,
    tool: "anthropic_api",
    plan: "api_direct",
    monthlySpendUsd: 0,
    seats: 0,
  },
  {
    enabled: false,
    tool: "openai_api",
    plan: "api_direct",
    monthlySpendUsd: 0,
    seats: 0,
  },
  { enabled: false, tool: "gemini", plan: "pro", monthlySpendUsd: 0, seats: 1 },
  { enabled: false, tool: "v0", plan: "pro", monthlySpendUsd: 0, seats: 1 },
];

const toolPlanOptions: Record<ToolPlan["tool"], ToolPlan["plan"][]> = {
  cursor: ["hobby", "pro", "business", "enterprise"],
  github_copilot: ["individual", "business", "enterprise"],
  claude: ["free", "pro", "max", "team", "enterprise", "api_direct"],
  chatgpt: ["plus", "team", "enterprise", "api_direct"],
  anthropic_api: ["api_direct"],
  openai_api: ["api_direct"],
  gemini: ["pro", "ultra", "api"],
  v0: ["free", "pro", "team"],
};

function toolLabel(tool: ToolPlan["tool"]): string {
  switch (tool) {
    case "cursor":
      return "Cursor";
    case "github_copilot":
      return "GitHub Copilot";
    case "claude":
      return "Claude";
    case "chatgpt":
      return "ChatGPT";
    case "anthropic_api":
      return "Anthropic API (direct)";
    case "openai_api":
      return "OpenAI API (direct)";
    case "gemini":
      return "Gemini";
    case "v0":
      return "v0";
  }
}

function prettyPlan(plan: string): string {
  return plan
    .replaceAll("_", " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

const persistedSchema = z.object({
  teamSize: z.number().int().min(1).max(10_000),
  primaryUseCase: z.enum(["coding", "writing", "data", "research", "mixed"]),
  tools: z.array(
    z.object({
      enabled: z.boolean(),
      tool: z.enum([
        "cursor",
        "github_copilot",
        "claude",
        "chatgpt",
        "anthropic_api",
        "openai_api",
        "gemini",
        "v0",
      ]),
      plan: z.string(),
      monthlySpendUsd: z.number().min(0).max(1_000_000),
      seats: z.number().int().min(0).max(100_000),
    }),
  ),
});

export default function AuditPage() {
  const [teamSize, setTeamSize] = useState<number>(3);
  const [primaryUseCase, setPrimaryUseCase] = useState<PrimaryUseCase>("coding");
  const [tools, setTools] = useState<ToolRow[]>(toolDefaults);

  useEffect(() => {
    const raw = readLocalStorageJson<unknown>(STORAGE_KEY);
    const parsed = persistedSchema.safeParse(raw);
    if (!parsed.success) return;

    setTeamSize(parsed.data.teamSize);
    setPrimaryUseCase(parsed.data.primaryUseCase);

    // Rebuild rows using defaults so we remain resilient to future schema changes.
    const byTool = new Map(parsed.data.tools.map((t) => [t.tool, t]));
    setTools((prev) =>
      prev.map((row) => {
        const saved = byTool.get(row.tool);
        if (!saved) return row;
        const allowedPlans = toolPlanOptions[row.tool] as string[];
        const plan = allowedPlans.includes(saved.plan) ? saved.plan : row.plan;
        return {
          ...row,
          enabled: saved.enabled,
          plan: plan as ToolPlan["plan"],
          monthlySpendUsd: saved.monthlySpendUsd,
          seats: saved.seats,
        };
      }),
    );
  }, []);

  useEffect(() => {
    writeLocalStorageJson(STORAGE_KEY, {
      teamSize,
      primaryUseCase,
      tools,
    });
  }, [teamSize, primaryUseCase, tools]);

  const auditInput: SpendAuditInput = useMemo(() => {
    return {
      teamSize,
      primaryUseCase,
      items: tools
        .filter((t) => t.enabled)
        .map((t) => ({
          toolPlan: { tool: t.tool, plan: t.plan } as ToolPlan,
          monthlySpendUsd: t.monthlySpendUsd,
          seats: t.seats,
        })),
    };
  }, [teamSize, primaryUseCase, tools]);

  const audit = useMemo(() => runAudit(auditInput), [auditInput]);

  return (
    <div className="min-h-full bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-sm font-semibold text-zinc-950">
            TokenLeak
          </Link>
          <div className="text-xs text-zinc-500">AI Spend Audit</div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h1 className="text-lg font-semibold text-zinc-950">
              Enter your AI tool spend
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Values auto-save in your browser.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-xs font-medium text-zinc-700">
                  Team size
                </span>
                <input
                  inputMode="numeric"
                  className="h-10 rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-900"
                  value={teamSize}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setTeamSize(Number.isFinite(n) && n > 0 ? Math.floor(n) : 1);
                  }}
                />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-medium text-zinc-700">
                  Primary use case
                </span>
                <select
                  className="h-10 rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-900"
                  value={primaryUseCase}
                  onChange={(e) =>
                    setPrimaryUseCase(e.target.value as PrimaryUseCase)
                  }
                >
                  <option value="coding">Coding</option>
                  <option value="writing">Writing</option>
                  <option value="data">Data</option>
                  <option value="research">Research</option>
                  <option value="mixed">Mixed</option>
                </select>
              </label>
            </div>

            <div className="mt-6">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Tools
              </div>
              <div className="mt-3 space-y-3">
                {tools.map((row, idx) => {
                  const plans = toolPlanOptions[row.tool];
                  return (
                    <div
                      key={row.tool}
                      className="rounded-xl border border-zinc-200 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-zinc-300"
                            checked={row.enabled}
                            onChange={(e) => {
                              const enabled = e.target.checked;
                              setTools((prev) =>
                                prev.map((r, i) =>
                                  i === idx ? { ...r, enabled } : r,
                                ),
                              );
                            }}
                          />
                          <span className="text-sm font-medium text-zinc-900">
                            {toolLabel(row.tool)}
                          </span>
                        </label>

                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            className="h-9 rounded-lg border border-zinc-300 px-2 text-sm outline-none focus:border-zinc-900"
                            value={row.plan}
                            onChange={(e) => {
                              const plan = e.target.value as ToolPlan["plan"];
                              setTools((prev) =>
                                prev.map((r, i) =>
                                  i === idx ? { ...r, plan } : r,
                                ),
                              );
                            }}
                            disabled={!row.enabled}
                          >
                            {plans.map((p) => (
                              <option key={p} value={p}>
                                {prettyPlan(p)}
                              </option>
                            ))}
                          </select>

                          <input
                            className="h-9 w-28 rounded-lg border border-zinc-300 px-2 text-sm outline-none focus:border-zinc-900 disabled:bg-zinc-100"
                            placeholder="$ / mo"
                            inputMode="decimal"
                            value={row.monthlySpendUsd || ""}
                            onChange={(e) => {
                              const n = Number(e.target.value);
                              setTools((prev) =>
                                prev.map((r, i) =>
                                  i === idx
                                    ? {
                                        ...r,
                                        monthlySpendUsd:
                                          Number.isFinite(n) && n >= 0 ? n : 0,
                                      }
                                    : r,
                                ),
                              );
                            }}
                            disabled={!row.enabled}
                          />

                          <input
                            className="h-9 w-20 rounded-lg border border-zinc-300 px-2 text-sm outline-none focus:border-zinc-900 disabled:bg-zinc-100"
                            placeholder="Seats"
                            inputMode="numeric"
                            value={row.seats}
                            onChange={(e) => {
                              const n = Number(e.target.value);
                              setTools((prev) =>
                                prev.map((r, i) =>
                                  i === idx
                                    ? {
                                        ...r,
                                        seats:
                                          Number.isFinite(n) && n >= 0
                                            ? Math.floor(n)
                                            : 0,
                                      }
                                    : r,
                                ),
                              );
                            }}
                            disabled={!row.enabled}
                          />
                        </div>
                      </div>

                      {!row.enabled ? null : (
                        <div className="mt-2 text-xs text-zinc-500">
                          Tip: enter what you actually pay (including annual
                          discounts averaged monthly).
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-950">
                  Instant audit
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Conservative estimates until we finish pricing citations.
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs font-medium text-zinc-500">
                  Potential savings
                </div>
                <div className="text-2xl font-semibold tracking-tight text-zinc-950">
                  ${audit.totalMonthlySavingsUsd.toFixed(0)}/mo
                </div>
                <div className="text-xs text-zinc-600">
                  ${audit.totalAnnualSavingsUsd.toFixed(0)}/yr
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-zinc-50 p-4">
              {audit.flags.highSavings ? (
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-zinc-950">
                    High-savings stack
                  </div>
                  <div className="text-sm text-zinc-700">
                    If you want to capture more of this savings, we’ll surface a
                    Credex consultation option after email capture.
                  </div>
                </div>
              ) : audit.flags.alreadyOptimal ? (
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-zinc-950">
                    Looks healthy
                  </div>
                  <div className="text-sm text-zinc-700">
                    Based on what you entered, you’re not obviously overspending.
                    We won’t invent savings.
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-zinc-950">
                    Some savings detected
                  </div>
                  <div className="text-sm text-zinc-700">
                    Review the per-tool recommendations below.
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Per-tool recommendations
              </div>
              <div className="mt-3 divide-y divide-zinc-200 rounded-xl border border-zinc-200">
                {audit.results.length === 0 ? (
                  <div className="p-4 text-sm text-zinc-600">
                    Select at least one tool to see an audit.
                  </div>
                ) : (
                  audit.results.map((r, i) => (
                    <div key={i} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-sm font-semibold text-zinc-950">
                            {toolLabel(r.toolPlan.tool)} —{" "}
                            {prettyPlan(r.toolPlan.plan)}
                          </div>
                          <div className="mt-1 text-sm text-zinc-700">
                            {r.reason}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-zinc-500">Savings</div>
                          <div className="text-sm font-semibold text-zinc-950">
                            ${r.monthlySavingsUsd.toFixed(0)}/mo
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-zinc-500">
                        Current: ${r.currentMonthlySpendUsd.toFixed(0)}/mo → Recommended: $
                        {r.recommendedMonthlySpendUsd.toFixed(0)}/mo • Action:{" "}
                        {prettyPlan(r.recommendedAction)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
                disabled
                title="Lead capture comes next (Supabase + email)."
              >
                Email me this report (coming next)
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                onClick={() => {
                  setTeamSize(3);
                  setPrimaryUseCase("coding");
                  setTools(toolDefaults);
                }}
              >
                Reset
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

