import { describe, expect, test } from "vitest";
import { runAudit } from "@/lib/auditEngine";
import type { SpendAuditInput } from "@/lib/tools";

function baseInput(overrides?: Partial<SpendAuditInput>): SpendAuditInput {
  return {
    teamSize: 3,
    primaryUseCase: "coding",
    items: [],
    ...overrides,
  };
}

describe("runAudit", () => {
  test("computes totals and annual savings", () => {
    const input = baseInput({
      items: [
        { toolPlan: { tool: "cursor", plan: "pro" }, monthlySpendUsd: 80, seats: 2 },
      ],
    });

    const out = runAudit(input);
    expect(out.totalCurrentMonthlySpendUsd).toBe(80);
    expect(out.totalAnnualSavingsUsd).toBe(out.totalMonthlySavingsUsd * 12);
  });

  test("flags high savings when > $500/mo", () => {
    const input = baseInput({
      items: [
        {
          toolPlan: { tool: "github_copilot", plan: "business" },
          monthlySpendUsd: 2000,
          seats: 10,
        },
      ],
    });

    const out = runAudit(input);
    expect(out.flags.highSavings).toBe(out.totalMonthlySavingsUsd > 500);
  });

  test("flags already optimal when < $100/mo savings", () => {
    const input = baseInput({
      items: [
        { toolPlan: { tool: "chatgpt", plan: "plus" }, monthlySpendUsd: 20, seats: 1 },
      ],
    });

    const out = runAudit(input);
    expect(out.flags.alreadyOptimal).toBe(true);
  });

  test("never produces negative savings", () => {
    const input = baseInput({
      items: [
        { toolPlan: { tool: "cursor", plan: "pro" }, monthlySpendUsd: -10, seats: 1 },
      ],
    });

    const out = runAudit(input);
    expect(out.totalMonthlySavingsUsd).toBeGreaterThanOrEqual(0);
    for (const r of out.results) {
      expect(r.monthlySavingsUsd).toBeGreaterThanOrEqual(0);
    }
  });

  test("review_pricing triggers when spend is > 20% above retail for known per-seat pricing", () => {
    const input = baseInput({
      items: [
        // Cursor Pro list price modeled as $20/seat/mo in pricing.ts
        { toolPlan: { tool: "cursor", plan: "pro" }, monthlySpendUsd: 60, seats: 2 },
      ],
    });

    const out = runAudit(input);
    expect(out.results[0]?.recommendedAction).toBe("review_pricing");
    expect(out.results[0]?.monthlySavingsUsd).toBe(20);
  });
});

