-- FieldBook — all M1 migrations, to run directly in the Supabase SQL Editor.
-- Creates the schema when the GitHub integration / REST API is unavailable.

-- ==================== supabase/migrations/20260712000001_profiles_and_roles.sql ====================
-- FieldBook — Migration 0001: profiles, roles, and role helpers
-- Single-business model: two roles, owner (full access) and crew (field work).
-- New signups default to 'crew'; promote the first owner manually (see seed).

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------
create type user_role as enum ('owner', 'crew');

create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null default '',
  role       user_role not null default 'crew',
  created_at timestamptz not null default now()
);

comment on table public.profiles is
  'App user profile, 1:1 with auth.users. Holds role for authorization.';

-- ---------------------------------------------------------------------------
-- Role helpers — SECURITY DEFINER so RLS policies can call them without
-- recursively evaluating the profiles policies (which would deadlock/deny).
-- Named app_role() rather than current_role() to avoid shadowing the built-in.
-- ---------------------------------------------------------------------------
create or replace function public.app_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'owner'
  );
$$;

-- ---------------------------------------------------------------------------
-- Auto-create a profile row whenever a new auth user is created.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'crew'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Prevent role self-escalation: only owners may change a profile's role.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_owner() then
    raise exception 'Only owners can change a user role';
  end if;
  return new;
end;
$$;

create trigger profiles_enforce_role_change
  before update on public.profiles
  for each row execute function public.enforce_role_change();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

-- Any authenticated user can read profiles (needed to show assignee names).
create policy "profiles: authenticated can read"
  on public.profiles for select
  to authenticated
  using (true);

-- A user can update their own profile; owners can update anyone.
-- The enforce_role_change trigger blocks non-owners from changing role.
create policy "profiles: self or owner can update"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.is_owner())
  with check (id = auth.uid() or public.is_owner());


-- ==================== supabase/migrations/20260712000002_shared.sql ====================
-- FieldBook — Migration 0002: shared helpers used across tables.

-- Keep an updated_at column current on any table that has one.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ==================== supabase/migrations/20260712000003_clients.sql ====================
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


-- ==================== supabase/migrations/20260712000004_price_items.sql ====================
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


-- ==================== register migrations so the GitHub integration treats them as applied ====================
create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (version text primary key, statements text[], name text);
insert into supabase_migrations.schema_migrations (version, name) values
  ('20260712000001','profiles_and_roles'),
  ('20260712000002','shared'),
  ('20260712000003','clients'),
  ('20260712000004','price_items')
on conflict (version) do nothing;
