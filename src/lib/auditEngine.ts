import type { SpendAuditInput, SpendLineItem, ToolPlan } from "@/lib/tools";
import { getListPriceUsdPerMonth } from "@/lib/pricing";

export type AuditRecommendationAction =
  | "keep"
  | "downgrade_same_vendor"
  | "switch_tool"
  | "buy_via_credits"
  | "review_pricing";

export type ToolAuditResult = {
  toolPlan: ToolPlan;
  currentMonthlySpendUsd: number;
  recommendedAction: AuditRecommendationAction;
  recommendedMonthlySpendUsd: number;
  monthlySavingsUsd: number;
  reason: string;
};

export type AuditSummary = {
  totalCurrentMonthlySpendUsd: number;
  totalRecommendedMonthlySpendUsd: number;
  totalMonthlySavingsUsd: number;
  totalAnnualSavingsUsd: number;
  results: ToolAuditResult[];
  flags: {
    highSavings: boolean;
    alreadyOptimal: boolean;
  };
};

function clampMoney(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  return Math.round(n * 100) / 100;
}

function inferExpectedRetailSpend(item: SpendLineItem): number | undefined {
  const list = getListPriceUsdPerMonth(item.toolPlan);
  if (!list) return undefined;
  if (list.basis === "per_seat") return list.usdPerMonth * Math.max(0, item.seats);
  if (list.basis === "flat") return list.usdPerMonth;
  return undefined;
}

function bestEffortRecommendation(item: SpendLineItem): ToolAuditResult {
  const current = clampMoney(item.monthlySpendUsd);

  // If we have a list price and user spend is meaningfully higher than retail,
  // recommend "review pricing" to surface obvious mismatches without inventing savings.
  const retail = inferExpectedRetailSpend(item);
  if (typeof retail === "number" && retail > 0 && current > retail * 1.2) {
    const recommended = clampMoney(retail);
    return {
      toolPlan: item.toolPlan,
      currentMonthlySpendUsd: current,
      recommendedAction: "review_pricing",
      recommendedMonthlySpendUsd: recommended,
      monthlySavingsUsd: clampMoney(current - recommended),
      reason:
        "Your reported spend is materially higher than the published list price for this plan and seat count.",
    };
  }

  // Seat-count sanity: if a seat-based plan is used with seats > team size,
  // recommend reducing seats (modeled as "downgrade_same_vendor" for now).
  const list = getListPriceUsdPerMonth(item.toolPlan);
  if (list?.basis === "per_seat" && item.seats > 0 && current > 0) {
    // If user is paying per-seat and seats is 0, data is inconsistent.
    // But if current is 0, keep.
    // We'll keep conservative here.
  }

  return {
    toolPlan: item.toolPlan,
    currentMonthlySpendUsd: current,
    recommendedAction: "keep",
    recommendedMonthlySpendUsd: current,
    monthlySavingsUsd: 0,
    reason: "No clear cost optimization applies based on the provided details.",
  };
}

export function runAudit(input: SpendAuditInput): AuditSummary {
  const results = input.items.map(bestEffortRecommendation);

  const totalCurrentMonthlySpendUsd = clampMoney(
    results.reduce((sum, r) => sum + r.currentMonthlySpendUsd, 0),
  );
  const totalRecommendedMonthlySpendUsd = clampMoney(
    results.reduce((sum, r) => sum + r.recommendedMonthlySpendUsd, 0),
  );
  const totalMonthlySavingsUsd = clampMoney(
    totalCurrentMonthlySpendUsd - totalRecommendedMonthlySpendUsd,
  );
  const totalAnnualSavingsUsd = clampMoney(totalMonthlySavingsUsd * 12);

  const highSavings = totalMonthlySavingsUsd > 500;
  const alreadyOptimal = totalMonthlySavingsUsd < 100;

  return {
    totalCurrentMonthlySpendUsd,
    totalRecommendedMonthlySpendUsd,
    totalMonthlySavingsUsd,
    totalAnnualSavingsUsd,
    results,
    flags: {
      highSavings,
      alreadyOptimal,
    },
  };
}

