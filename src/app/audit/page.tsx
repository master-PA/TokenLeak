"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import type { PrimaryUseCase, SpendAuditInput, ToolPlan } from "@/lib/tools";
import { runAudit } from "@/lib/auditEngine";
import { readLocalStorageJson, writeLocalStorageJson } from "@/lib/localStorage";
import Image from "next/image";

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

function toolTagline(tool: ToolPlan["tool"]): string {
  switch (tool) {
    case "cursor":
      return "Editor + coding agent";
    case "github_copilot":
      return "Inline code completion";
    case "claude":
      return "Chat + coding + research";
    case "chatgpt":
      return "Chat + data + general";
    case "anthropic_api":
      return "Metered usage (tokens)";
    case "openai_api":
      return "Metered usage (tokens)";
    case "gemini":
      return "Google AI plans + API";
    case "v0":
      return "UI generation";
  }
}

function formatUsd(n: number): string {
  if (!Number.isFinite(n)) return "$0";
  const v = Math.max(0, n);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: v >= 100 ? 0 : 2,
  }).format(v);
}

export default function AuditPage() {
  const [teamSize, setTeamSize] = useState<number>(3);
  const [primaryUseCase, setPrimaryUseCase] = useState<PrimaryUseCase>("coding");
  const [tools, setTools] = useState<ToolRow[]>(toolDefaults);
  const [shareState, setShareState] = useState<
    | { status: "idle" }
    | { status: "creating" }
    | { status: "ready"; url: string }
    | { status: "error"; message: string }
  >({ status: "idle" });
  const [summaryState, setSummaryState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "ready"; summary: string }
    | { status: "error" }
  >({ status: "idle" });
  const [leadState, setLeadState] = useState<
    | { status: "idle" }
    | { status: "submitting" }
    | { status: "ok" }
    | { status: "error"; message: string }
  >({ status: "idle" });
  const [leadEmail, setLeadEmail] = useState("");
  const [leadCompany, setLeadCompany] = useState("");
  const [leadRole, setLeadRole] = useState("");
  const [honeypot, setHoneypot] = useState("");

  useEffect(() => {
    const raw = readLocalStorageJson<unknown>(STORAGE_KEY);
    const parsed = persistedSchema.safeParse(raw);
    if (!parsed.success) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTeamSize(parsed.data.teamSize);
    setPrimaryUseCase(parsed.data.primaryUseCase);

    const byTool = new Map(parsed.data.tools.map((t) => [t.tool, t]));
    setTools(
      toolDefaults.map((row) => {
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

  const [auditResult, setAuditResult] = useState<ReturnType<typeof runAudit> | null>(null);

  const handleRunAudit = () => {
    const result = runAudit(auditInput);
    setAuditResult(result);

    if (result.results.length === 0) {
      setSummaryState({ status: "idle" });
      return;
    }

    setSummaryState({ status: "loading" });
    fetch("/api/summary", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ auditResult: result }),
    })
      .then(async (r) => {
        const j = (await r.json()) as { summary?: string };
        if (j.summary) setSummaryState({ status: "ready", summary: j.summary });
        else setSummaryState({ status: "error" });
      })
      .catch(() => {
        setSummaryState({ status: "error" });
      });
  };

  const audit = auditResult || {
    totalMonthlySavingsUsd: 0,
    totalAnnualSavingsUsd: 0,
    results: [],
    flags: { highSavings: false, alreadyOptimal: false },
    currentMonthlySpendUsd: 0,
    recommendedMonthlySpendUsd: 0
  };

  return (
    <div className="min-h-full bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/tokenleak-logo.png"
              alt="TokenLeak"
              width={24}
              height={24}
              className="h-6 w-6"
              priority
            />
            <div className="text-sm font-semibold text-zinc-950">TokenLeak</div>
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
                  className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900"
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
                  className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900"
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
                      className="rounded-xl border border-zinc-200 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <label className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            className="mt-0.5 h-4 w-4 rounded border-zinc-300"
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
                          <span>
                            <div className="text-sm font-medium text-zinc-900">
                              {toolLabel(row.tool)}
                            </div>
                            <div className="mt-0.5 text-xs text-zinc-500">
                              {toolTagline(row.tool)}
                            </div>
                          </span>
                        </label>

                        <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-3 sm:items-center">
                          <select
                            className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 disabled:bg-zinc-100 disabled:text-zinc-500"
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

                          <label className="relative">
                            <span className="sr-only">Monthly spend</span>
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                              $
                            </span>
                            <input
                              className="h-10 w-full rounded-lg border border-zinc-300 bg-white pl-7 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 disabled:bg-zinc-100 disabled:text-zinc-500"
                              placeholder="Monthly"
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
                                            Number.isFinite(n) && n >= 0
                                              ? n
                                              : 0,
                                        }
                                      : r,
                                  ),
                                );
                              }}
                              disabled={!row.enabled}
                            />
                          </label>

                          <label className="relative">
                            <span className="sr-only">Seats</span>
                            <input
                              className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 disabled:bg-zinc-100 disabled:text-zinc-500"
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
                          </label>
                        </div>
                      </div>

                      {!row.enabled ? null : (
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
                          <div>
                            Tip: enter what you actually pay (annual discounts averaged monthly).
                          </div>
                          <div className="font-medium text-zinc-700">
                            {formatUsd(row.monthlySpendUsd)}/mo
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 flex justify-end border-t border-zinc-200 pt-5">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
                onClick={handleRunAudit}
              >
                Run Audit
              </button>
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
              {!auditResult ? (
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-zinc-950">Ready to audit</div>
                  <div className="text-sm text-zinc-700">Click &quot;Run Audit&quot; to analyze your spend.</div>
                </div>
              ) : audit.flags.highSavings ? (
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
                Personalized summary
              </div>
              <div className="mt-2 rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
                {!auditResult ? (
                  <div className="text-zinc-600">Click &quot;Run Audit&quot; to generate a personalized summary.</div>
                ) : audit.results.length === 0 ? (
                  <div className="text-zinc-600">
                    Add at least one tool to generate a summary.
                  </div>
                ) : summaryState.status === "loading" ? (
                  <div className="text-zinc-600">Generating…</div>
                ) : summaryState.status === "ready" ? (
                  <p className="leading-6">{summaryState.summary}</p>
                ) : (
                  <div className="text-zinc-600">
                    Summary unavailable right now.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Per-tool recommendations
              </div>
              <div className="mt-3 divide-y divide-zinc-200 rounded-xl border border-zinc-200">
                {!auditResult ? (
                  <div className="p-4 text-sm text-zinc-600">
                    Click &quot;Run Audit&quot; to see per-tool recommendations.
                  </div>
                ) : audit.results.length === 0 ? (
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
                className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-60"
                disabled={audit.results.length === 0 || shareState.status === "creating"}
                onClick={async () => {
                  try {
                    setShareState({ status: "creating" });
                    const res = await fetch("/api/audits", {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ auditInput, auditResult: audit }),
                    });
                    if (!res.ok) {
                      const text = await res.text();
                      throw new Error(text || `HTTP ${res.status}`);
                    }
                    const data = (await res.json()) as { slug: string };
                    const url = `${window.location.origin}/share/${data.slug}`;
                    setShareState({ status: "ready", url });
                  } catch (e) {
                    setShareState({
                      status: "error",
                      message: e instanceof Error ? e.message : "Unknown error",
                    });
                  }
                }}
              >
                Create share link
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                onClick={() => {
                  setTeamSize(3);
                  setPrimaryUseCase("coding");
                  setTools(toolDefaults);
                  setShareState({ status: "idle" });
                }}
              >
                Reset
              </button>
            </div>

            {shareState.status === "ready" ? (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <div className="text-sm font-semibold text-emerald-900">
                  Share link ready
                </div>
                <div className="mt-1 break-all text-sm text-emerald-900">
                  <a className="underline" href={shareState.url}>
                    {shareState.url}
                  </a>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                    onClick={async () => {
                      await navigator.clipboard.writeText(shareState.url);
                    }}
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
                    onClick={() => setShareState({ status: "idle" })}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ) : shareState.status === "error" ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
                <div className="text-sm font-semibold text-red-900">
                  Couldn’t create share link
                </div>
                <div className="mt-1 text-sm text-red-900">
                  {shareState.message}
                </div>
              </div>
            ) : null}

            <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-zinc-950">
                    Get this report by email
                  </div>
                  <div className="mt-1 text-sm text-zinc-600">
                    Email is captured only after you see value. We’ll include your share link.
                  </div>
                </div>
                {audit.flags.highSavings ? (
                  <div className="rounded-xl bg-zinc-50 px-3 py-2 text-xs text-zinc-700">
                    High-savings case: we’ll highlight a Credex consultation option in the email.
                  </div>
                ) : null}
              </div>

              <form
                className="mt-4 grid gap-3 sm:grid-cols-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (shareState.status !== "ready") {
                    setLeadState({
                      status: "error",
                      message: "Create a share link first.",
                    });
                    return;
                  }
                  try {
                    setLeadState({ status: "submitting" });
                    const slug = new URL(shareState.url).pathname.split("/").pop() || "";
                    const res = await fetch("/api/leads", {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({
                        auditSlug: slug,
                        email: leadEmail,
                        companyName: leadCompany || undefined,
                        role: leadRole || undefined,
                        teamSize,
                        website: honeypot || undefined,
                      }),
                    });
                    if (!res.ok) {
                      const text = await res.text();
                      throw new Error(text || `HTTP ${res.status}`);
                    }
                    setLeadState({ status: "ok" });
                  } catch (err) {
                    setLeadState({
                      status: "error",
                      message: err instanceof Error ? err.message : "Unknown error",
                    });
                  }
                }}
              >
                <label className="grid gap-1">
                  <span className="text-xs font-medium text-zinc-700">Email</span>
                  <input
                    className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs font-medium text-zinc-700">Company (optional)</span>
                  <input
                    className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900"
                    value={leadCompany}
                    onChange={(e) => setLeadCompany(e.target.value)}
                    placeholder="Acme"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs font-medium text-zinc-700">Role (optional)</span>
                  <input
                    className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900"
                    value={leadRole}
                    onChange={(e) => setLeadRole(e.target.value)}
                    placeholder="Founder / Eng Manager"
                  />
                </label>

                {/* Honeypot */}
                <label className="hidden">
                  <span>Website</span>
                  <input value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
                </label>

                <div className="flex items-end gap-3 sm:col-span-2">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
                    disabled={
                      leadState.status === "submitting" || shareState.status !== "ready"
                    }
                  >
                    {leadState.status === "submitting" ? "Sending…" : "Email me the report"}
                  </button>
                  {leadState.status === "ok" ? (
                    <div className="text-sm font-medium text-emerald-700">
                      Sent. Check your inbox.
                    </div>
                  ) : leadState.status === "error" ? (
                    <div className="text-sm font-medium text-red-700">
                      {leadState.message}
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500">
                      Requires Supabase + Resend env to fully work.
                    </div>
                  )}
                </div>
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

