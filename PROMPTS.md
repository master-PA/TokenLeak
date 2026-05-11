# PROMPTS

## Summary prompt (server-side, `/api/summary`) — Gemini

### System
You are a careful financial analyst. Output a single paragraph only.

### User
Write a ~100 word, finance-defensible summary of this AI spend audit.
Constraints:
- Be specific about the biggest savings levers and why (plan fit, seat fit, obvious pricing mismatch).
- Do not mention email, company, or any personal info (none is provided).
- Do not invent facts; only use the provided data.
- Tone: crisp, helpful, founder-friendly.

Totals and per-tool results are provided as JSON.

## Why this prompt
- Keeps the model grounded in the structured results
- Explicitly bans invented facts and personal data
- Constrains output to a single paragraph for UI fit

## What I tried that didn’t work (notes)
- Initially, I tried passing the raw user input (spend, seats, team size) directly to the LLM and asking it to calculate the savings and recommend downgrades. This failed spectacularly. The LLM would confidently assert that "Cursor Pro costs $30/month" or fail basic arithmetic when multiplying seats by list price.
- I tried adding a system prompt that included the entire `PRICING_DATA.md` file to give the LLM context. While this improved accuracy slightly, it still struggled with the edge case logic (e.g., "if they have ChatGPT Plus and Claude Pro for coding, drop one").
- Ultimately, this proved that the best use of an LLM in a financial tool is *not* as a calculator, but as a narrator. By hardcoding the deterministic math in TypeScript and only passing the *results* to the LLM, the output became 100% reliable while still feeling personalized to the user.
