# ARCHITECTURE

## System diagram

```mermaid
flowchart LR
  U[User] -->|fills form| FE[Next.js UI (/audit)]
  FE -->|runs deterministic rules| AE[Audit engine (TS)]
  FE -->|POST /api/summary| SUM[Summary API]
  SUM -->|Anthropic (optional)| LLM[Anthropic API]
  SUM -->|fallback| SUM
  FE -->|POST /api/audits| AUDIT_API[Audits API]
  AUDIT_API --> DB[(Supabase Postgres: audits)]
  FE -->|POST /api/leads| LEAD_API[Leads API]
  LEAD_API --> DB2[(Supabase Postgres: leads)]
  LEAD_API --> EMAIL[Resend email]
  SHARE[/share/{slug}/] -->|server fetch| DB
```

## Data flow: input → audit result
- User inputs tools/plans/spend/seats + team size + use case on `/audit`
- Form state persists in localStorage
- The audit engine computes:
  - per-tool recommendation + reason + savings
  - totals (monthly + annual)
- User can generate a public share URL (`/share/{slug}`) by storing a **sanitized** snapshot in `audits.public_json`
- After value is shown, user can submit email to store a lead and receive a transactional email with the share link

## Stack choice
- **Next.js (App Router) + TypeScript + Tailwind**: fast to ship, great DX, easy OG + server routes, good Lighthouse potential.
- **Supabase (Postgres)**: simple persistence for audits + leads, easy to operate.
- **Resend**: minimal transactional email API.

## Scaling to 10k audits/day
- Move rate limiting from in-memory to a shared store (Upstash Redis / Cloudflare KV)
- Add DB indexes (`audits.public_slug`, `leads.audit_slug`, `leads.created_at`)
- Cache share page reads at the edge (or store a rendered OG image)
- Queue email sending (background job) to decouple from request latency

