-- Affiliate Marketing Tool schema.
-- Additive only: does not touch the pre-existing leads/workflows/workflow_shares tables.
-- All access happens server-side via the Supabase service role key, so RLS is
-- intentionally left off these tables (they are never queried with the anon key).

create extension if not exists pgcrypto;

create table if not exists affiliate_programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  network text,
  commission_type text not null default 'percentage' check (commission_type in ('percentage', 'flat')),
  commission_rate numeric not null default 0,
  cookie_duration_days integer,
  payment_schedule text,
  status text not null default 'active' check (status in ('active', 'paused', 'ended')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists affiliate_links (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references affiliate_programs(id) on delete set null,
  slug text not null unique,
  destination_url text not null,
  label text,
  campaign text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists affiliate_links_program_id_idx on affiliate_links(program_id);

create table if not exists affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references affiliate_links(id) on delete cascade,
  clicked_at timestamptz not null default now(),
  referrer text,
  user_agent text,
  ip_hash text
);

create index if not exists affiliate_clicks_link_id_idx on affiliate_clicks(link_id);
create index if not exists affiliate_clicks_clicked_at_idx on affiliate_clicks(clicked_at);

create table if not exists affiliate_conversions (
  id uuid primary key default gen_random_uuid(),
  link_id uuid references affiliate_links(id) on delete set null,
  program_id uuid references affiliate_programs(id) on delete set null,
  amount numeric not null default 0,
  converted_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists affiliate_conversions_link_id_idx on affiliate_conversions(link_id);
create index if not exists affiliate_conversions_program_id_idx on affiliate_conversions(program_id);

create table if not exists affiliate_content (
  id uuid primary key default gen_random_uuid(),
  content_type text not null,
  niche text,
  product text,
  brief text not null,
  output_text text not null,
  share_token text unique,
  created_at timestamptz not null default now()
);

create index if not exists affiliate_content_share_token_idx on affiliate_content(share_token);
