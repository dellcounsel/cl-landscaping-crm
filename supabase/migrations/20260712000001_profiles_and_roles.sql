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
