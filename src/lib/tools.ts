export type PrimaryUseCase = "coding" | "writing" | "data" | "research" | "mixed";

export type AiToolKey =
  | "cursor"
  | "github_copilot"
  | "claude"
  | "chatgpt"
  | "anthropic_api"
  | "openai_api"
  | "gemini"
  | "v0";

export type ToolPlan =
  | { tool: "cursor"; plan: "hobby" | "pro" | "business" | "enterprise" }
  | {
      tool: "github_copilot";
      plan: "individual" | "business" | "enterprise";
    }
  | {
      tool: "claude";
      plan: "free" | "pro" | "max" | "team" | "enterprise" | "api_direct";
    }
  | {
      tool: "chatgpt";
      plan: "plus" | "team" | "enterprise" | "api_direct";
    }
  | { tool: "anthropic_api"; plan: "api_direct" }
  | { tool: "openai_api"; plan: "api_direct" }
  | { tool: "gemini"; plan: "pro" | "ultra" | "api" }
  | { tool: "v0"; plan: "free" | "pro" | "team" };

export type SpendLineItem = {
  toolPlan: ToolPlan;
  /** Monthly spend user reports for this tool (USD). */
  monthlySpendUsd: number;
  /** Seats/licenses paid for this tool (0 allowed for API-only). */
  seats: number;
};

export type SpendAuditInput = {
  teamSize: number;
  primaryUseCase: PrimaryUseCase;
  items: SpendLineItem[];
};

