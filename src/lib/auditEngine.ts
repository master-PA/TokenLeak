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

function auditItem(item: SpendLineItem, input: SpendAuditInput, allItems: SpendLineItem[]): ToolAuditResult {
  const current = clampMoney(item.monthlySpendUsd);
  const list = getListPriceUsdPerMonth(item.toolPlan);
  const retail = inferExpectedRetailSpend(item);

  // Rule 4: Paying retail vs credits (for API usage)
  if (item.toolPlan.plan === "api_direct" || item.toolPlan.plan === "api") {
      if (current >= 500) {
          return {
              toolPlan: item.toolPlan,
              currentMonthlySpendUsd: current,
              recommendedAction: "buy_via_credits",
              // Assume 20% discount with Credex for high spend
              recommendedMonthlySpendUsd: clampMoney(current * 0.8),
              monthlySavingsUsd: clampMoney(current * 0.2),
              reason: "High API spend detected. You can likely purchase discounted credits via Credex instead of paying full retail."
          };
      }
  }

  // Rule 1 & 2: Right plan for usage and Cheaper plan from same vendor
  if (list?.basis === "per_seat") {
      const isTeamPlan = ["team", "business", "enterprise"].includes(item.toolPlan.plan);
      
      // If they have more seats than team size, that's an immediate overspend.
      if (item.seats > input.teamSize && input.teamSize > 0) {
          const expectedRetail = list.usdPerMonth * input.teamSize;
          return {
              toolPlan: item.toolPlan,
              currentMonthlySpendUsd: current,
              recommendedAction: "downgrade_same_vendor",
              recommendedMonthlySpendUsd: clampMoney(expectedRetail),
              monthlySavingsUsd: clampMoney(current - expectedRetail),
              reason: `You are paying for ${item.seats} seats but your team size is ${input.teamSize}. Reduce unused seats.`
          };
      }

      // If they are on a team plan but have < 2 users, downgrade to individual/pro.
      if (isTeamPlan && Math.min(item.seats, input.teamSize) < 2) {
          let lowerPlanPrice = 20; // Default pro price
          let lowerPlanName = "Pro/Plus";
          if (item.toolPlan.tool === "github_copilot") { lowerPlanPrice = 10; lowerPlanName = "Individual"; }
          if (item.toolPlan.tool === "chatgpt") { lowerPlanPrice = 20; lowerPlanName = "Plus"; }
          if (item.toolPlan.tool === "claude") { lowerPlanPrice = 20; lowerPlanName = "Pro"; }
          if (item.toolPlan.tool === "cursor") { lowerPlanPrice = 20; lowerPlanName = "Pro"; }
          if (item.toolPlan.tool === "v0") { lowerPlanPrice = 20; lowerPlanName = "Premium"; }

          if (current > lowerPlanPrice) {
              return {
                  toolPlan: item.toolPlan,
                  currentMonthlySpendUsd: current,
                  recommendedAction: "downgrade_same_vendor",
                  recommendedMonthlySpendUsd: clampMoney(lowerPlanPrice),
                  monthlySavingsUsd: clampMoney(current - lowerPlanPrice),
                  reason: `Team/Business plans are overkill for 1 user. Downgrade to the ${lowerPlanName} plan.`
              };
          }
      }
  }

  // Rule 3: Cheaper alternative tool
  if (input.primaryUseCase === "coding") {
      if ((item.toolPlan.tool === "chatgpt" || item.toolPlan.tool === "claude") && item.toolPlan.plan !== "api_direct") {
          const hasCodingAgent = allItems.some(i => i.toolPlan.tool === "cursor" || i.toolPlan.tool === "github_copilot");
          if (hasCodingAgent) {
              return {
                  toolPlan: item.toolPlan,
                  currentMonthlySpendUsd: current,
                  recommendedAction: "switch_tool",
                  recommendedMonthlySpendUsd: 0,
                  monthlySavingsUsd: current,
                  reason: `Since your primary use case is coding and you already have a dedicated coding tool, consider dropping ${item.toolPlan.tool} to reduce redundant spend.`
              };
          }
      }
  }

  // Fallback: If user spend is meaningfully higher than retail
  if (typeof retail === "number" && retail > 0 && current > retail * 1.2) {
      return {
          toolPlan: item.toolPlan,
          currentMonthlySpendUsd: current,
          recommendedAction: "review_pricing",
          recommendedMonthlySpendUsd: clampMoney(retail),
          monthlySavingsUsd: clampMoney(current - retail),
          reason: "Your reported spend is materially higher than the published list price for this plan and seat count. Review your billing."
      };
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
  const results = input.items.map(item => auditItem(item, input, input.items));

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
