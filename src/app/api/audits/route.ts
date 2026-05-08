import { NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { createSupabaseServerClient } from "@/lib/supabase";

const createAuditSchema = z.object({
  auditInput: z.object({
    teamSize: z.number().int().min(1).max(10_000),
    primaryUseCase: z.enum(["coding", "writing", "data", "research", "mixed"]),
    items: z.array(
      z.object({
        toolPlan: z.object({
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
        }),
        monthlySpendUsd: z.number().min(0).max(1_000_000),
        seats: z.number().int().min(0).max(100_000),
      }),
    ),
  }),
  auditResult: z.object({
    totalCurrentMonthlySpendUsd: z.number(),
    totalRecommendedMonthlySpendUsd: z.number(),
    totalMonthlySavingsUsd: z.number(),
    totalAnnualSavingsUsd: z.number(),
    results: z.array(
      z.object({
        toolPlan: z.object({
          tool: z.string(),
          plan: z.string(),
        }),
        currentMonthlySpendUsd: z.number(),
        recommendedAction: z.string(),
        recommendedMonthlySpendUsd: z.number(),
        monthlySavingsUsd: z.number(),
        reason: z.string(),
      }),
    ),
    flags: z.object({
      highSavings: z.boolean(),
      alreadyOptimal: z.boolean(),
    }),
  }),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = createAuditSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const slug = nanoid(10);
  const supabase = createSupabaseServerClient();

  // Public payload intentionally excludes identifying info (email/company).
  const publicJson = {
    auditInput: parsed.data.auditInput,
    auditResult: parsed.data.auditResult,
    createdAt: new Date().toISOString(),
  };

  const { error } = await supabase.from("audits").insert({
    public_slug: slug,
    public_json: publicJson,
    total_monthly_savings: parsed.data.auditResult.totalMonthlySavingsUsd,
    total_annual_savings: parsed.data.auditResult.totalAnnualSavingsUsd,
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to store audit", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ slug });
}

