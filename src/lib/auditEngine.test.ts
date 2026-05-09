import { describe, it, expect } from "vitest";
import { runAudit } from "./auditEngine";
import type { SpendAuditInput } from "./tools";

describe("auditEngine", () => {
  it("should recommend keep when usage matches list price and team size", () => {
    const input: SpendAuditInput = {
      teamSize: 1,
      primaryUseCase: "coding",
      items: [
        {
          toolPlan: { tool: "cursor", plan: "pro" },
          monthlySpendUsd: 20,
          seats: 1,
        },
      ],
    };
    const summary = runAudit(input);
    expect(summary.results[0].recommendedAction).toBe("keep");
    expect(summary.totalMonthlySavingsUsd).toBe(0);
  });

  it("should detect unused seats as a downgrade", () => {
    const input: SpendAuditInput = {
      teamSize: 2,
      primaryUseCase: "coding",
      items: [
        {
          toolPlan: { tool: "cursor", plan: "pro" },
          monthlySpendUsd: 100,
          seats: 5,
        },
      ],
    };
    const summary = runAudit(input);
    expect(summary.results[0].recommendedAction).toBe("downgrade_same_vendor");
    expect(summary.results[0].recommendedMonthlySpendUsd).toBe(40);
    expect(summary.results[0].monthlySavingsUsd).toBe(60);
    expect(summary.totalMonthlySavingsUsd).toBe(60);
  });

  it("should detect team plan for 1 user as an overkill downgrade", () => {
    const input: SpendAuditInput = {
      teamSize: 1,
      primaryUseCase: "writing",
      items: [
        {
          toolPlan: { tool: "chatgpt", plan: "team" },
          monthlySpendUsd: 30,
          seats: 1,
        },
      ],
    };
    const summary = runAudit(input);
    expect(summary.results[0].recommendedAction).toBe("downgrade_same_vendor");
    expect(summary.results[0].recommendedMonthlySpendUsd).toBe(20);
    expect(summary.totalMonthlySavingsUsd).toBe(10);
  });

  it("should recommend dropping redundant tools if primary use case is coding", () => {
    const input: SpendAuditInput = {
      teamSize: 1,
      primaryUseCase: "coding",
      items: [
        {
          toolPlan: { tool: "cursor", plan: "pro" },
          monthlySpendUsd: 20,
          seats: 1,
        },
        {
          toolPlan: { tool: "chatgpt", plan: "plus" },
          monthlySpendUsd: 20,
          seats: 1,
        },
      ],
    };
    const summary = runAudit(input);
    // Cursor should be kept
    expect(summary.results[0].recommendedAction).toBe("keep");
    // ChatGPT Plus should be dropped
    expect(summary.results[1].recommendedAction).toBe("switch_tool");
    expect(summary.results[1].recommendedMonthlySpendUsd).toBe(0);
    expect(summary.totalMonthlySavingsUsd).toBe(20);
  });

  it("should flag high API spend for Credex", () => {
    const input: SpendAuditInput = {
      teamSize: 10,
      primaryUseCase: "mixed",
      items: [
        {
          toolPlan: { tool: "anthropic_api", plan: "api_direct" },
          monthlySpendUsd: 600,
          seats: 0,
        },
      ],
    };
    const summary = runAudit(input);
    expect(summary.results[0].recommendedAction).toBe("buy_via_credits");
    expect(summary.flags.highSavings).toBe(false); // Because savings is 120, not >500
    expect(summary.totalMonthlySavingsUsd).toBe(120);
  });
});
