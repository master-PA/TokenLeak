import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-baseline gap-2">
            <div className="flex items-center gap-2">
              <Image
                src="/tokenleak-logo.png"
                alt="TokenLeak"
                width={24}
                height={24}
                className="h-6 w-6"
                priority
              />
              <div className="text-sm font-semibold tracking-tight text-zinc-950">
                TokenLeak
              </div>
            </div>
            <div className="text-xs text-zinc-500">AI Spend Audit</div>
          </div>
          <Link
            href="/audit"
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Run free audit
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <div className="grid gap-8 md:grid-cols-2 md:gap-10">
          <div className="space-y-5">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-zinc-950 md:text-4xl">
              Find overspend in your AI stack in 2 minutes.
            </h1>
            <p className="text-base leading-7 text-zinc-600">
              Enter what you pay for tools like Cursor, Copilot, Claude, ChatGPT,
              APIs, Gemini, and v0. Get an instant audit with defensible
              recommendations and estimated savings.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/audit"
                className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Start audit
              </Link>
              <Link
                href="/audit"
                className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                See example results
              </Link>
            </div>
            <div className="text-xs leading-5 text-zinc-500">
              No login. Email only after you see the savings.
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-zinc-950">
              What you get
            </div>
            <ul className="mt-4 space-y-3 text-sm text-zinc-700">
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-zinc-900" />
                Per-tool breakdown with a one-sentence reason
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-zinc-900" />
                Total monthly + annual savings, clear and shareable
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-zinc-900" />
                Personalized summary generated via LLM (with safe fallback)
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-zinc-900" />
                For high-savings stacks, an option to book a consultation
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
