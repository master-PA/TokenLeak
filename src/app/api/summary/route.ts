import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  auditResult: z.object({
    totalMonthlySavingsUsd: z.number(),
    totalAnnualSavingsUsd: z.number(),
    results: z.array(
      z.object({
        toolPlan: z.object({ tool: z.string(), plan: z.string() }),
        monthlySavingsUsd: z.number(),
        recommendedAction: z.string(),
        reason: z.string(),
      }),
    ),
    flags: z.object({ highSavings: z.boolean(), alreadyOptimal: z.boolean() }),
  }),
});

function fallbackSummary(input: z.infer<typeof schema>): string {
  const monthly = Math.round(input.auditResult.totalMonthlySavingsUsd || 0);
  const annual = Math.round(input.auditResult.totalAnnualSavingsUsd || 0);
  const top = [...input.auditResult.results]
    .sort((a, b) => (b.monthlySavingsUsd || 0) - (a.monthlySavingsUsd || 0))
    .slice(0, 2);

  const topLine =
    top.length === 0
      ? "No tool-level optimizations were detected from the provided inputs."
      : `Top levers: ${top
          .map(
            (r) =>
              `${r.toolPlan.tool} (${Math.round(r.monthlySavingsUsd)}/mo)`,
          )
          .join(", ")}.`;

  if (input.auditResult.flags.alreadyOptimal) {
    return `Based on what you entered, your AI spend looks healthy. Estimated savings are modest (~$${monthly}/mo, $${annual}/yr). ${topLine} If your team or usage changes, rerun the audit to catch new optimization opportunities.`;
  }

  return `Your AI stack shows potential savings of about $${monthly}/mo ($${annual}/yr). ${topLine} These recommendations are conservative and based on plan/seat fit and obvious pricing mismatches.`;
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ summary: fallbackSummary(parsed.data) });
  }

  const monthly = Math.round(parsed.data.auditResult.totalMonthlySavingsUsd || 0);
  const annual = Math.round(parsed.data.auditResult.totalAnnualSavingsUsd || 0);

  const userPrompt = [
    "Write a ~100 word, finance-defensible summary of this AI spend audit.",
    "Constraints:",
    "- Be specific about the biggest savings levers and why (plan fit, seat fit, obvious pricing mismatch).",
    "- Do not mention email, company, or any personal info (none is provided).",
    "- Do not invent facts; only use the provided data.",
    "- Tone: crisp, helpful, founder-friendly.",
    "",
    `Totals: $${monthly}/mo ($${annual}/yr) potential savings.`,
    "",
    "Per-tool results JSON:",
    JSON.stringify(parsed.data.auditResult.results),
  ].join("\n");

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(
        apiKey,
      )}`,
      {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: [
                  "You are a careful financial analyst.",
                  "Output a single paragraph only.",
                  "",
                  userPrompt,
                ].join("\n"),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 220,
        },
      }),
      },
    );

    if (!res.ok) {
      return NextResponse.json({ summary: fallbackSummary(parsed.data) });
    }

    const data = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    const text =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("")?.trim() ??
      "";
    if (!text) {
      return NextResponse.json({ summary: fallbackSummary(parsed.data) });
    }

    return NextResponse.json({ summary: text });
  } catch {
    return NextResponse.json({ summary: fallbackSummary(parsed.data) });
  }
}

