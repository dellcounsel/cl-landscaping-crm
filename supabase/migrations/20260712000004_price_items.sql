-- FieldBook — Migration 0004: price_items (owner-managed price list)
-- Pricing is financial data: crew has NO access at all (read or write).
-- Rates stored as integer cents.

create type price_unit as enum ('flat', 'hour', 'yard', 'sqft');

create table public.price_items (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  unit               price_unit not null default 'flat',
  default_rate_cents integer not null default 0 check (default_rate_cents >= 0),
  active             boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index price_items_active_idx on public.price_items (active);

create trigger price_items_set_updated_at
  before update on public.price_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — owner only for ALL operations (crew cannot see pricing).
-- ---------------------------------------------------------------------------
alter table public.price_items enable row level security;

create policy "price_items: owner can read"
  on public.price_items for select
  to authenticated
  using (public.is_owner());

create policy "price_items: owner can insert"
  on public.price_items for insert
  to authenticated
  with check (public.is_owner());

create policy "price_items: owner can update"
  on public.price_items for update
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create policy "price_items: owner can delete"
  on public.price_items for delete
  to authenticated
  using (public.is_owner());
