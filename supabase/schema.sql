-- CalcSwap marketplace schema
-- Run this once in your Supabase project's SQL editor.

create extension if not exists pgcrypto;

create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  seller_token text not null unique,
  seller_email text not null,
  seller_name text not null,
  title text not null,
  brand text not null,
  model text not null,
  condition text not null check (condition in ('New', 'Like New', 'Good', 'Fair')),
  price_cents integer not null check (price_cents > 0),
  description text not null,
  photo_url text,
  venmo_username text,
  paypal_username text,
  cashapp_cashtag text,
  zelle_contact text,
  ship_from_name text not null,
  ship_from_address1 text not null,
  ship_from_address2 text,
  ship_from_city text not null,
  ship_from_state text not null,
  ship_from_zip text not null,
  status text not null default 'available' check (status in ('available', 'pending', 'sold', 'removed'))
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  listing_id uuid not null references listings(id) on delete cascade,
  buyer_token text not null unique,
  buyer_email text not null,
  buyer_name text not null,
  ship_to_name text not null,
  ship_to_address1 text not null,
  ship_to_address2 text,
  ship_to_city text not null,
  ship_to_state text not null,
  ship_to_zip text not null,
  payment_method text not null check (payment_method in ('venmo', 'paypal', 'cashapp', 'zelle')),
  amount_cents integer not null check (amount_cents > 0),
  status text not null default 'awaiting_payment' check (
    status in (
      'awaiting_payment',
      'payment_claimed',
      'payment_confirmed',
      'label_created',
      'shipped',
      'completed',
      'cancelled'
    )
  ),
  buyer_marked_paid_at timestamptz,
  seller_confirmed_at timestamptz,
  label_url text,
  label_is_demo boolean not null default true,
  tracking_number text,
  carrier text,
  shipped_at timestamptz
);

create index if not exists listings_status_idx on listings (status);
create index if not exists orders_listing_id_idx on orders (listing_id);

-- All reads/writes happen through the server using the Supabase service role
-- key, so lock the tables down from the anon/public API entirely.
alter table listings enable row level security;
alter table orders enable row level security;
