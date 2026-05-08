import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function toolLabel(tool: string): string {
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
    default:
      return tool;
  }
}

function prettyPlan(plan: string): string {
  return plan
    .replaceAll("_", " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

type StoredAudit = {
  public_slug: string;
  public_json: {
    auditResult: {
      totalMonthlySavingsUsd: number;
      totalAnnualSavingsUsd: number;
      results: Array<{
        toolPlan: { tool: string; plan: string };
        currentMonthlySpendUsd: number;
        recommendedMonthlySpendUsd: number;
        recommendedAction: string;
        monthlySavingsUsd: number;
        reason: string;
      }>;
      flags: { highSavings: boolean; alreadyOptimal: boolean };
    };
  };
};

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("audits")
    .select("public_slug, public_json")
    .eq("public_slug", slug)
    .maybeSingle();

  const audit = data as StoredAudit | null;
  if (!audit) {
    return {
      title: "TokenLeak — Audit not found",
      robots: { index: false, follow: false },
    };
  }

  const monthly = audit.public_json.auditResult.totalMonthlySavingsUsd ?? 0;
  const annual = audit.public_json.auditResult.totalAnnualSavingsUsd ?? 0;
  const title = `TokenLeak — $${Math.round(monthly)}/mo savings`;
  const description = `Shared AI spend audit. Estimated savings: $${Math.round(
    monthly,
  )}/mo ($${Math.round(annual)}/yr).`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function SharePage(props: PageProps) {
  const { slug } = await props.params;
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("audits")
    .select("public_slug, public_json")
    .eq("public_slug", slug)
    .maybeSingle();

  const audit = data as StoredAudit | null;
  if (!audit) notFound();

  const result = audit.public_json.auditResult;

  return (
    <div className="min-h-full bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-sm font-semibold text-zinc-950">
            TokenLeak
          </Link>
          <div className="text-xs text-zinc-500">Shared audit</div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-zinc-950">
                AI Spend Audit
              </h1>
              <p className="mt-1 text-sm text-zinc-600">
                Public, shareable version. No email or company info included.
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs font-medium text-zinc-500">
                Potential savings
              </div>
              <div className="text-3xl font-semibold tracking-tight text-zinc-950">
                ${Math.round(result.totalMonthlySavingsUsd)}/mo
              </div>
              <div className="text-sm text-zinc-600">
                ${Math.round(result.totalAnnualSavingsUsd)}/yr
              </div>
            </div>
          </div>

          <div className="mt-6 divide-y divide-zinc-200 rounded-xl border border-zinc-200">
            {result.results.map((r, i) => (
              <div key={i} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-zinc-950">
                      {toolLabel(r.toolPlan.tool)} — {prettyPlan(r.toolPlan.plan)}
                    </div>
                    <div className="mt-1 text-sm text-zinc-700">{r.reason}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-zinc-500">Savings</div>
                    <div className="text-sm font-semibold text-zinc-950">
                      ${Math.round(r.monthlySavingsUsd)}/mo
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-zinc-500">
                  Current: ${Math.round(r.currentMonthlySpendUsd)}/mo →
                  Recommended: ${Math.round(r.recommendedMonthlySpendUsd)}/mo •
                  Action: {prettyPlan(r.recommendedAction)}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/audit"
              className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Run your own audit
            </Link>
            <div className="text-xs text-zinc-500">
              Share ID: <span className="font-mono">{audit.public_slug}</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

