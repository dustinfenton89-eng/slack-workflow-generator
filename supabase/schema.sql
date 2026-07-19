-- Options Trading Coach schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) for a fresh project.
-- Replaces the old slack-workflow-generator schema (leads / workflows / workflow_shares),
-- which you can drop separately if it still exists:
--   drop table if exists workflow_shares, workflows, leads cascade;

create extension if not exists "pgcrypto";

-- One row per authenticated user, mirrors auth.users.
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

-- Each user gets a single simulated brokerage account with starting cash.
create table if not exists paper_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  cash_balance numeric(14, 2) not null default 100000.00,
  created_at timestamptz not null default now()
);
create index if not exists paper_accounts_user_id_idx on paper_accounts (user_id);

-- Open/closed simulated positions (stock or single option contract per row).
create table if not exists paper_positions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references paper_accounts (id) on delete cascade,
  underlying text not null,
  option_symbol text, -- null for a plain stock position
  contract_type text not null check (contract_type in ('call', 'put', 'stock')),
  strike numeric(12, 4),
  expiration date,
  side text not null check (side in ('long', 'short')),
  quantity numeric(12, 4) not null check (quantity > 0),
  avg_price numeric(12, 4) not null,
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);
create index if not exists paper_positions_account_id_idx on paper_positions (account_id);

-- Immutable trade log, one row per simulated fill.
create table if not exists paper_orders (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references paper_accounts (id) on delete cascade,
  underlying text not null,
  option_symbol text,
  contract_type text not null check (contract_type in ('call', 'put', 'stock')),
  side text not null check (side in ('buy', 'sell')),
  quantity numeric(12, 4) not null check (quantity > 0),
  fill_price numeric(12, 4) not null,
  status text not null default 'filled' check (status in ('filled', 'rejected')),
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists paper_orders_account_id_idx on paper_orders (account_id);

create table if not exists watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  symbol text not null,
  created_at timestamptz not null default now(),
  unique (user_id, symbol)
);

create table if not exists strategies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  underlying text not null,
  legs jsonb not null, -- array of { type: call|put, side: long|short, strike, expiration, premium, quantity }
  notes text,
  ai_feedback text,
  created_at timestamptz not null default now()
);
create index if not exists strategies_user_id_idx on strategies (user_id);

create table if not exists ai_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists ai_messages_user_id_idx on ai_messages (user_id, created_at);

-- Auto-provision a profile + a funded paper account whenever a new auth user is created.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  insert into public.paper_accounts (user_id, cash_balance) values (new.id, 100000.00);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Row Level Security: every user can only see/modify their own data.
alter table profiles enable row level security;
alter table paper_accounts enable row level security;
alter table paper_positions enable row level security;
alter table paper_orders enable row level security;
alter table watchlists enable row level security;
alter table strategies enable row level security;
alter table ai_messages enable row level security;

drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);

drop policy if exists "paper_accounts_select_own" on paper_accounts;
create policy "paper_accounts_select_own" on paper_accounts for select using (auth.uid() = user_id);

drop policy if exists "paper_positions_select_own" on paper_positions;
create policy "paper_positions_select_own" on paper_positions for select using (
  auth.uid() = (select user_id from paper_accounts where paper_accounts.id = paper_positions.account_id)
);

drop policy if exists "paper_orders_select_own" on paper_orders;
create policy "paper_orders_select_own" on paper_orders for select using (
  auth.uid() = (select user_id from paper_accounts where paper_accounts.id = paper_orders.account_id)
);

drop policy if exists "watchlists_all_own" on watchlists;
create policy "watchlists_all_own" on watchlists for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "strategies_all_own" on strategies;
create policy "strategies_all_own" on strategies for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "ai_messages_all_own" on ai_messages;
create policy "ai_messages_all_own" on ai_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Note: paper_positions / paper_orders / paper_accounts writes happen exclusively through
-- server-side API routes using the Supabase service-role client (app/_lib/supabaseAdmin.ts),
-- which bypasses RLS after verifying the requesting user's session. This keeps trade-execution
-- logic (balance checks, fill pricing) authoritative on the server instead of trusting the client.
