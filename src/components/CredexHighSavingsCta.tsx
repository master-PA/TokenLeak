import Link from "next/link";
import { getCredexBookUrl } from "@/lib/site";

type Props = {
  /** Monthly estimated savings shown in this audit (for copy only). */
  monthlySavingsUsd: number;
  className?: string;
};

/**
 * Mandatory UX for audits with > $500/mo savings: Credex as the lever to capture more savings on credits.
 */
export function CredexHighSavingsCta({ monthlySavingsUsd, className }: Props) {
  const href = getCredexBookUrl();
  const rounded = Math.round(monthlySavingsUsd);

  return (
    <div
      className={
        className ??
        "rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-4 shadow-sm"
      }
    >
      <div className="text-sm font-semibold text-rose-900">
        Capture more of your ~${rounded}/mo opportunity
      </div>
      <p className="mt-2 text-sm leading-relaxed text-rose-950/85">
        Plan changes help, but the biggest wins often come from{" "}
        <span className="font-medium text-rose-950">discounted AI credits</span>{" "}
        (Cursor, Claude, ChatGPT Enterprise, APIs). Credex bundles real
        surplus inventory—book a quick consult to map what applies to your
        stack.
      </p>
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
      >
        Book a Credex consultation
      </Link>
      <div className="mt-2 text-xs text-rose-900/65">
        No obligation. Bring this audit and your invoices.
      </div>
    </div>
  );
}
