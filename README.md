# TokenLeak — AI Spend Audit

TokenLeak is a free web app for **founders and engineering managers** to audit what they spend on AI tools (Cursor, Copilot, Claude, ChatGPT, APIs, Gemini, v0) and get **instant, defensible savings recommendations** plus a **shareable public report URL**.

## Screenshots / demo
- TODO: add 3+ screenshots
- TODO: add a 30s Loom/YouTube link

## Deployed URL
- TODO: add deployed URL

## Quick start (local)

```bash
npm i
npm run dev
```

Create a local `.env.local` with:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (not currently used for writes)
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM`
- `ANTHROPIC_API_KEY`

Supabase schema: see `SUPABASE_SCHEMA.md`.

## Deploy
- Recommended: Vercel
- Set the same environment variables in Vercel Project Settings

## Decisions (trade-offs)
1. **Server-side Supabase writes**: use service role key on the server so public pages and inserts don’t depend on RLS policy complexity.
2. **Conservative audit logic**: prefer “review pricing” and \( \$0 \) savings over inventing savings when inputs/pricing are incomplete.
3. **Email after value**: the audit is always visible before any email capture.
4. **Unique share URL per audit**: share page is sanitized (no email/company), enabling safe viral sharing.
5. **LLM for summary only**: audit math stays deterministic; AI is used just for a ~100-word narrative summary with fallback.

