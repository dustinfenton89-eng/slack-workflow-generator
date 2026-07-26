-- CalcSwap buyback schema
-- Run this once in your Supabase project's SQL editor.
-- (Replaces the earlier peer-to-peer "listings"/"orders" schema, if you ran that version.)

create extension if not exists pgcrypto;

drop table if exists orders;
drop table if exists listings;

create table if not exists trade_ins (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  seller_token text not null unique,

  -- Snapshot of the catalog quote at submission time, so later price changes
  -- don't retroactively change what an in-flight trade-in pays out.
  model_key text not null,
  brand text not null,
  model text not null,
  condition text not null check (condition in ('New', 'Like New', 'Good', 'Fair')),
  payout_cents integer not null check (payout_cents > 0),

  seller_name text not null,
  seller_email text not null,
  payment_method text not null check (payment_method in ('venmo', 'paypal', 'cashapp', 'zelle')),
  payment_handle text not null,

  ship_from_name text not null,
  ship_from_address1 text not null,
  ship_from_address2 text,
  ship_from_city text not null,
  ship_from_state text not null,
  ship_from_zip text not null,

  status text not null default 'awaiting_shipment' check (
    status in ('awaiting_shipment', 'shipped', 'received', 'paid', 'rejected', 'cancelled')
  ),

  label_url text,
  label_is_demo boolean not null default true,
  tracking_number text,
  carrier text,

  shipped_at timestamptz,
  received_at timestamptz,
  paid_at timestamptz,
  admin_notes text
);

create index if not exists trade_ins_status_idx on trade_ins (status);

-- All reads/writes happen through the server using the Supabase service role
-- key, so lock the table down from the anon/public API entirely.
alter table trade_ins enable row level security;
