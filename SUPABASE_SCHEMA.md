# Supabase schema (TokenLeak)

This repo expects two tables: `audits` and `leads`.

## SQL (copy/paste into Supabase SQL editor)

```sql
-- Audits: public shareable snapshots (no email/company stored here)
create table if not exists public.audits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  public_slug text not null unique,
  public_json jsonb not null,
  total_monthly_savings numeric not null default 0,
  total_annual_savings numeric not null default 0
);

-- Leads: captured after value is shown
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  audit_slug text not null references public.audits(public_slug) on delete cascade,
  email text not null,
  company_name text null,
  role text null,
  team_size integer null,
  high_savings boolean not null default false,
  source_ip text null
);
```

## Notes
- The app uses a **server-side Supabase service role key** for inserts/reads on share pages.
- Keep RLS enabled if you want, but **do not expose** the service role key to the browser.

