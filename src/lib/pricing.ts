import type { ToolPlan } from "@/lib/tools";

/**
 * NOTE: Keep this in sync with PRICING_DATA.md.
 * All numbers must trace to official vendor URLs with verified dates.
 */

export type PriceBasis = "per_seat" | "flat" | "metered";

export type PlanPrice = {
  basis: PriceBasis;
  /** For per-seat: price per seat per month. For flat: total monthly. */
  usdPerMonth: number;
};

export function getListPriceUsdPerMonth(
  toolPlan: ToolPlan,
): PlanPrice | undefined {
  switch (toolPlan.tool) {
    case "cursor": {
      switch (toolPlan.plan) {
        case "hobby":
          return { basis: "per_seat", usdPerMonth: 0 };
        case "pro":
          return { basis: "per_seat", usdPerMonth: 20 };
        case "business":
          return { basis: "per_seat", usdPerMonth: 40 };
        case "enterprise":
          return { basis: "per_seat", usdPerMonth: 0 }; // sales
      }
      break;
    }
    case "github_copilot": {
      switch (toolPlan.plan) {
        case "individual":
          return { basis: "per_seat", usdPerMonth: 10 };
        case "business":
          return { basis: "per_seat", usdPerMonth: 19 };
        case "enterprise":
          return { basis: "per_seat", usdPerMonth: 39 };
      }
      break;
    }
    case "claude":
      // Claude pricing varies by region and enterprise contracts; set placeholders.
      // We'll finalize exact values and citations in PRICING_DATA.md.
      switch (toolPlan.plan) {
        case "free":
          return { basis: "per_seat", usdPerMonth: 0 };
        case "pro":
          return { basis: "per_seat", usdPerMonth: 20 };
        case "max":
          return { basis: "per_seat", usdPerMonth: 0 }; // tiered; TBD
        case "team":
          return { basis: "per_seat", usdPerMonth: 0 }; // TBD
        case "enterprise":
          return { basis: "per_seat", usdPerMonth: 0 }; // sales
        case "api_direct":
          return { basis: "metered", usdPerMonth: 0 };
      }
      break;
    case "chatgpt":
      switch (toolPlan.plan) {
        case "plus":
          return { basis: "per_seat", usdPerMonth: 20 };
        case "team":
          return { basis: "per_seat", usdPerMonth: 30 };
        case "enterprise":
          return { basis: "per_seat", usdPerMonth: 0 }; // sales
        case "api_direct":
          return { basis: "metered", usdPerMonth: 0 };
      }
      break;
    case "anthropic_api":
      return { basis: "metered", usdPerMonth: 0 };
    case "openai_api":
      return { basis: "metered", usdPerMonth: 0 };
    case "gemini":
      switch (toolPlan.plan) {
        case "pro":
          return { basis: "per_seat", usdPerMonth: 0 }; // TBD
        case "ultra":
          return { basis: "per_seat", usdPerMonth: 0 }; // TBD
        case "api":
          return { basis: "metered", usdPerMonth: 0 };
      }
      break;
    case "v0":
      switch (toolPlan.plan) {
        case "free":
          return { basis: "per_seat", usdPerMonth: 0 };
        case "pro":
          return { basis: "per_seat", usdPerMonth: 0 }; // TBD
        case "team":
          return { basis: "per_seat", usdPerMonth: 0 }; // TBD
      }
      break;
  }

  return undefined;
}

