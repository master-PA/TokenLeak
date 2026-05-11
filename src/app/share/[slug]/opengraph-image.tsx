import { ImageResponse } from "next/og";
import { createSupabaseServerClient } from "@/lib/supabase";

export const alt = "TokenLeak AI Spend Audit preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Row = {
  public_json: {
    auditResult?: {
      totalMonthlySavingsUsd?: number;
      totalAnnualSavingsUsd?: number;
    };
  };
};

async function loadSavings(slug: string): Promise<{
  monthly: number;
  annual: number;
}> {
  try {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase
      .from("audits")
      .select("public_json")
      .eq("public_slug", slug)
      .maybeSingle();

    const row = data as Row | null;
    const monthly = Number(
      row?.public_json?.auditResult?.totalMonthlySavingsUsd ?? 0,
    );
    const annual = Number(
      row?.public_json?.auditResult?.totalAnnualSavingsUsd ?? 0,
    );
    return {
      monthly: Number.isFinite(monthly) ? monthly : 0,
      annual: Number.isFinite(annual) ? annual : 0,
    };
  } catch {
    return { monthly: 0, annual: 0 };
  }
}

export default async function OgImage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const { monthly, annual } = await loadSavings(slug);
  const m = Math.round(monthly);
  const y = Math.round(annual);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg,#0f172a 0%,#1e293b 45%,#0f172a 100%)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "#f43f5e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            TL
          </div>
          <div style={{ fontSize: 42, fontWeight: 700, letterSpacing: -1 }}>
            TokenLeak
          </div>
        </div>

        <div>
          <div style={{ fontSize: 52, fontWeight: 700, letterSpacing: -2 }}>
            ~${m}/mo potential savings
          </div>
          <div style={{ marginTop: 16, fontSize: 34, opacity: 0.88 }}>
            ${y}/yr annualized • AI spend audit
          </div>
        </div>

        <div style={{ fontSize: 26, opacity: 0.72 }}>
          Shared AI savings snapshot • run your free audit
        </div>
      </div>
    ),
    size,
  );
}
