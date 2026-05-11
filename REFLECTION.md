# REFLECTION

## 1) The hardest bug you hit this week, and how you debugged it
The hardest bug I encountered was a hydration mismatch error in Next.js related to the `localStorage` persistence of the audit form state. When the page initially loaded on the server, the state initialized with `teamSize: 3` and default empty tools. However, on the client side, the `useEffect` hook would read from `localStorage` and immediately update the state to the user's previously saved values. This caused the React tree rendered on the server to differ from the initial client render, throwing a massive hydration error in the console and briefly flashing the default state before snapping to the saved state. 

To debug it, I first checked the Next.js documentation on hydration errors. My initial hypothesis was to conditionally render the entire form only after a `mounted` state was set to true. While this worked, it caused a layout shift and a poor user experience (the form was invisible for a split second). 

The final solution I landed on was to let the server render the default state safely, and use a `useEffect` on the client to silently overwrite the state. By separating the initial `useState` initialization from the `localStorage` read inside a `useEffect`, React handles the state update as a standard re-render rather than a hydration mismatch. It’s a common Next.js gotcha, but debugging the visual flashing vs. the console error took a couple of hours of trial and error.

## 2) A decision you reversed mid-week, and what made you reverse it
Mid-week, I reversed the decision to use an LLM (Anthropic) for the core audit math. Initially, I thought it would be clever to pass the user's entire tool stack as JSON to Claude and have it dynamically generate savings recommendations. I built a quick prototype.

However, I reversed this entirely and rewrote the audit engine using strict, deterministic TypeScript rules. The catalyst for the reversal was twofold:
1. **Hallucinations:** The LLM occasionally invented prices. It told one test case that ChatGPT Team was $40/user, leading to a mathematically incorrect "savings" of $10/mo. 
2. **Defensibility:** The prompt explicitly stated, "A finance person should read your reasoning and agree." A finance person will never trust an audit if the math changes depending on the LLM's temperature. 

I reversed course, hardcoded the pricing data in `pricing.ts`, and wrote strict `if/else` rules for downgrades. I kept the LLM exclusively for generating the personalized text summary at the end, which is where it actually shines.

## 3) What you would build in week 2 if you had it
If I had a second week, I would focus entirely on **distribution and embedding**.
Right now, TokenLeak is a destination URL. To really scale as a lead-generation tool, it needs to be where the founders already are.
I would build an embeddable widget version of the audit tool (a `<script>` tag). I would then partner with startup accelerators (like YC or Techstars) and popular startup newsletters (like Lenny's Newsletter) to embed the calculator directly into their articles on "managing runway" or "SaaS bloat." 

Additionally, I would implement a "Benchmark Mode." Right now, the tool tells you if you are overspending against retail prices. Benchmark mode would aggregate the anonymized data from all audits and tell the user: *"You spend $150/mo per engineer on AI. The average Series A company spends $80/mo. You are in the 90th percentile of spenders."* This creates a much stronger psychological trigger to book a consultation with Credex.

## 4) How you used AI tools
I used **Cursor** as my primary IDE and heavily relied on its Composer feature for boilerplate generation.
For example, I asked Cursor to: *"Scaffold a Next.js app router page with a responsive grid layout and Tailwind CSS for the TokenLeak landing page."* This saved me hours of typing out `div` classes.
However, I strictly **did not trust the AI with the business logic or unit economics**. When drafting `ECONOMICS.md`, I forced myself to use a blank spreadsheet and calculate the CAC to LTV ratios manually. 

One specific time the AI was wrong: I asked an LLM to "give me the current pricing for Claude." It confidently told me Claude Pro was $20, but it completely hallucinated the existence of a "Claude Max" plan for $50/mo. I caught it by manually verifying against the official anthropic.com/pricing page, which proved to me why the deterministic `PRICING_DATA.md` file was absolutely necessary.

## 5) Self-rating (1–10) + one-sentence reason each
- **Discipline: 9/10.** I paced the commits across the week and prioritized the business deliverables rather than just endlessly tweaking the UI.
- **Code quality: 8/10.** The deterministic engine is robust and typed with Zod, though the Next.js API routes could be abstracted slightly better.
- **Design sense: 8/10.** It looks clean, trustworthy, and premium using a monochromatic Tailwind palette, avoiding the "cheap template" feel.
- **Problem-solving: 9/10.** I correctly identified that LLMs shouldn't do math, and cleanly separated the deterministic audit from the generative summary.
- **Entrepreneurial thinking: 10/10.** I treated this strictly as a CAC/LTV lead-gen asset for Credex, defining clear pivot triggers and realistic GTM outreach rather than relying on "SEO."
