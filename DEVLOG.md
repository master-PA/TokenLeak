# DEVLOG

## Day 1 — 2026-05-08
**Hours worked:** 3
**What I did:** Read the prompt, outlined the architecture, and initialized the Next.js project. Set up Tailwind and the basic project structure. Started looking into vendor pricing pages to figure out the data model.
**What I learned:** Pricing is incredibly opaque for Enterprise plans, and Anthropic makes it slightly confusing to differentiate Claude Pro vs their API direct pricing in a simple form.
**Blockers / what I'm stuck on:** Need to figure out the best way to handle "team" plans where a user might input 1 seat (which violates most team plan minimums).
**Plan for tomorrow:** Build out the core UI for the input form and set up local state persistence.

## Day 2 — 2026-05-09
**Hours worked:** 4
**What I did:** Built the `/audit` page form. Added state management with React `useState` and synchronized it to `localStorage` so users don't lose data on refresh.
**What I learned:** Using a `Map` or `zod` schema to parse `localStorage` is crucial because the data structure might change as I add more tools.
**Blockers / what I'm stuck on:** None currently.
**Plan for tomorrow:** Implement the first version of the audit engine logic (`src/lib/auditEngine.ts`) and hook it up to the UI.

## Day 3 — 2026-05-10
**Hours worked:** 5
**What I did:** Wrote the core deterministic logic for the audit engine. Implemented rules for right-sizing seats and identifying when team plans are overkill for small teams.
**What I learned:** It's better to be conservative and recommend "review pricing" than to invent savings that don't exist. If the math isn't 100% defensible, a finance person will reject the tool.
**Blockers / what I'm stuck on:** Gathering the exact links and verification dates for the pricing data is tedious but necessary.
**Plan for tomorrow:** Finish `PRICING_DATA.md` and start working on the backend integration (Supabase).

## Day 4 — 2026-05-11
**Hours worked:** 4
**What I did:** Set up Supabase for storing leads and generating unique public share URLs. Created the `/api/audits` and `/api/leads` endpoints using Next.js App Router route handlers.
**What I learned:** Using the Supabase Service Role key securely on the server side lets me bypass complex RLS policies for a simple public insertion workflow.
**Blockers / what I'm stuck on:** Need to decide on an email provider. Resend looks easiest.
**Plan for tomorrow:** Implement Resend email sending and the LLM personalized summary using the Anthropic/Gemini API.

## Day 5 — 2026-05-12
**Hours worked:** 3
**What I did:** Added the LLM summary feature. Hooked up the Gemini/Anthropic API to generate a 100-word paragraph based on the deterministic audit results.
**What I learned:** LLMs are great for summarizing data, but I'm glad I kept the actual math deterministic. The LLM would hallucinate savings amounts occasionally.
**Blockers / what I'm stuck on:** Handling API rate limits gracefully if multiple users hit the summary endpoint simultaneously.
**Plan for tomorrow:** Work on the business deliverables: GTM, Economics, and Landing page copy.

## Day 6 — 2026-05-13
**Hours worked:** 4
**What I did:** Drafted the `GTM.md`, `ECONOMICS.md`, and `LANDING_COPY.md`. Wrote unit tests for the audit engine using Vitest.
**What I learned:** Thinking through the unit economics (CAC vs LTV) fundamentally changed how I view this project. It's not just a calculator; it's a qualified lead pipeline.
**Blockers / what I'm stuck on:** Trying to find 3 real Fractional CTOs / VP Engs to interview. Reached out on LinkedIn.
**Plan for tomorrow:** Conduct user interviews, add the CI/CD pipeline, and polish the UI.

## Day 7 — 2026-05-14
**Hours worked:** 3
**What I did:** Conducted user interviews and added notes to `USER_INTERVIEWS.md`. Set up GitHub Actions CI for linting and tests. Deployed to Vercel.
**What I learned:** Users are actually very willing to talk about their SaaS bloat; it's a massive pain point.
**Blockers / what I'm stuck on:** None. Project is ready for submission.
**Plan for tomorrow:** Submit to Credex.

