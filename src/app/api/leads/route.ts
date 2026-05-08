import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { basicRateLimit } from "@/lib/rateLimit";
import { createSupabaseServerClient } from "@/lib/supabase";

const leadSchema = z.object({
  auditSlug: z.string().min(4).max(64),
  email: z.string().email().max(320),
  companyName: z.string().max(200).optional(),
  role: z.string().max(200).optional(),
  teamSize: z.number().int().min(1).max(10_000).optional(),
  // Honeypot: must be empty.
  website: z.string().max(200).optional(),
});

function getClientIp(req: Request): string {
  // Vercel / proxies
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]!.trim();
  return "unknown";
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = basicRateLimit({ key: `leads:${ip}`, windowMs: 60_000, max: 10 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Rate limited" },
      { status: 429, headers: { "retry-after": String(rl.retryAfterSeconds) } },
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = leadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  // Honeypot: pretend success.
  if (parsed.data.website && parsed.data.website.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createSupabaseServerClient();
  const { data: auditRow, error: auditErr } = await supabase
    .from("audits")
    .select("public_slug, total_monthly_savings, total_annual_savings, public_json")
    .eq("public_slug", parsed.data.auditSlug)
    .maybeSingle();

  if (auditErr || !auditRow) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }

  const highSavings = Number(auditRow.total_monthly_savings ?? 0) > 500;

  const { error: leadErr } = await supabase.from("leads").insert({
    audit_slug: parsed.data.auditSlug,
    email: parsed.data.email,
    company_name: parsed.data.companyName ?? null,
    role: parsed.data.role ?? null,
    team_size: parsed.data.teamSize ?? null,
    high_savings: highSavings,
    source_ip: ip,
  });

  if (leadErr) {
    return NextResponse.json(
      { error: "Failed to store lead", detail: leadErr.message },
      { status: 500 },
    );
  }

  const resendKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM;
  if (resendKey && resendFrom) {
    const resend = new Resend(resendKey);
    const shareUrl = `${new URL(req.url).origin}/share/${parsed.data.auditSlug}`;
    const monthly = Math.round(Number(auditRow.total_monthly_savings ?? 0));
    const annual = Math.round(Number(auditRow.total_annual_savings ?? 0));

    const subject = `Your TokenLeak audit: $${monthly}/mo potential savings`;
    const bodyText = [
      "Thanks for using TokenLeak.",
      "",
      `Your shareable audit link: ${shareUrl}`,
      `Estimated savings: $${monthly}/mo ($${annual}/yr)`,
      "",
      highSavings
        ? "Because your potential savings are significant, Credex can help you capture more of them. Reply to this email and we’ll reach out."
        : "If your stack changes, rerun the audit anytime to see if new optimizations apply.",
      "",
      "— TokenLeak",
    ].join("\n");

    // Don’t fail the request if email fails.
    await resend.emails.send({
      from: resendFrom,
      to: parsed.data.email,
      subject,
      text: bodyText,
    });
  }

  return NextResponse.json({ ok: true, highSavings });
}

