-- FieldBook — Migration 0003: clients
-- Crew may READ clients (they need name + property address to reach jobs).
-- Only owners may create/edit/delete clients.

create table public.clients (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  email            text,
  phone            text,
  billing_address  text,
  property_address text,
  notes            text,
  tags             text[] not null default '{}',
  status           text not null default 'active'
                     check (status in ('active', 'inactive')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index clients_status_idx on public.clients (status);
create index clients_name_idx on public.clients (lower(name));
-- Trigram index to speed up name/address/phone search.
create extension if not exists pg_trgm;
create index clients_search_idx on public.clients
  using gin (
    (coalesce(name, '') || ' ' ||
     coalesce(property_address, '') || ' ' ||
     coalesce(billing_address, '') || ' ' ||
     coalesce(phone, '')) gin_trgm_ops
  );

create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.clients enable row level security;

create policy "clients: authenticated can read"
  on public.clients for select
  to authenticated
  using (true);

create policy "clients: owner can insert"
  on public.clients for insert
  to authenticated
  with check (public.is_owner());

create policy "clients: owner can update"
  on public.clients for update
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create policy "clients: owner can delete"
  on public.clients for delete
  to authenticated
  using (public.is_owner());
