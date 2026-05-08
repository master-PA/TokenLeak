# PROMPTS

## Summary prompt (server-side, `/api/summary`)

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
- TODO

