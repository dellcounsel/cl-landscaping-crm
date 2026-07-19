-- FieldBook M3 — jobs + recurrences migration, run in the Supabase SQL Editor.
-- (Only needed if the GitHub integration did not auto-apply it.)

-- FieldBook — Migration: jobs + recurrences (M3)
-- recurrences = the series template; jobs = concrete occurrences and one-offs.
-- Occurrences carry an immutable series_date (their slot in the series) that is
-- separate from scheduled_date (where they actually sit), so rescheduling or
-- skipping an occurrence never causes the daily materializer to recreate it.

-- ---------------------------------------------------------------------------
-- recurrences (owner-managed series template)
-- ---------------------------------------------------------------------------
create type recur_freq as enum ('daily', 'weekly', 'monthly');

create table public.recurrences (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references public.clients (id) on delete cascade,
  title            text not null,
  freq             recur_freq not null,
  interval_count   integer not null default 1 check (interval_count >= 1),
  scheduled_time   time,
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  assigned_to      uuid[] not null default '{}',
  notes            text,
  anchor_date      date not null,
  until_date       date,
  active           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index recurrences_client_idx on public.recurrences (client_id);
create index recurrences_active_idx on public.recurrences (active);

create trigger recurrences_set_updated_at
  before update on public.recurrences
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- jobs (occurrences + one-offs)
-- ---------------------------------------------------------------------------
create type job_status as enum (
  'scheduled', 'in_progress', 'done', 'skipped', 'invoiced'
);

create table public.jobs (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references public.clients (id) on delete cascade,
  quote_id         uuid references public.quotes (id) on delete set null,
  recurrence_id    uuid references public.recurrences (id) on delete cascade,
  title            text not null,
  scheduled_date   date not null,
  series_date      date,
  scheduled_time   time,
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  status           job_status not null default 'scheduled',
  assigned_to      uuid[] not null default '{}',
  notes            text,
  is_exception     boolean not null default false,
  gcal_event_id    text,
  completed_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- One occurrence per series slot — makes materialization idempotent and works
-- as an ON CONFLICT target. Non-partial: one-off jobs have (null, null) keys,
-- and NULLs are distinct in a unique index, so they never collide.
create unique index jobs_recurrence_series_idx
  on public.jobs (recurrence_id, series_date);

create index jobs_scheduled_date_idx on public.jobs (scheduled_date);
create index jobs_status_idx on public.jobs (status);
create index jobs_client_idx on public.jobs (client_id);
create index jobs_assigned_to_idx on public.jobs using gin (assigned_to);

create trigger jobs_set_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Crew guard: on update, non-owners may only change status (to in_progress /
-- done / scheduled), notes, and completed_at. Owners are unrestricted.
-- ---------------------------------------------------------------------------
create or replace function public.jobs_crew_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_owner() then
    return new;
  end if;

  if new.client_id       is distinct from old.client_id
     or new.quote_id      is distinct from old.quote_id
     or new.recurrence_id is distinct from old.recurrence_id
     or new.title         is distinct from old.title
     or new.scheduled_date is distinct from old.scheduled_date
     or new.series_date   is distinct from old.series_date
     or new.scheduled_time is distinct from old.scheduled_time
     or new.duration_minutes is distinct from old.duration_minutes
     or new.assigned_to   is distinct from old.assigned_to
     or new.is_exception  is distinct from old.is_exception
     or new.gcal_event_id is distinct from old.gcal_event_id
  then
    raise exception 'Crew can only update job status and notes';
  end if;

  if new.status not in ('scheduled', 'in_progress', 'done') then
    raise exception 'Crew cannot set job status to %', new.status;
  end if;

  return new;
end;
$$;

create trigger jobs_crew_guard_trg
  before update on public.jobs
  for each row execute function public.jobs_crew_guard();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.recurrences enable row level security;

-- Series are owner-only (crew interact with individual jobs, not the template).
create policy "recurrences: owner all"
  on public.recurrences for all
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

alter table public.jobs enable row level security;

-- Everyone authenticated can read jobs (crew need the schedule). Jobs carry no
-- pricing, so this exposes no financial data.
create policy "jobs: authenticated can read"
  on public.jobs for select
  to authenticated
  using (true);

create policy "jobs: owner can insert"
  on public.jobs for insert
  to authenticated
  with check (public.is_owner());

-- Owner or crew may update; the jobs_crew_guard trigger limits what crew change.
create policy "jobs: authenticated can update"
  on public.jobs for update
  to authenticated
  using (true)
  with check (true);

create policy "jobs: owner can delete"
  on public.jobs for delete
  to authenticated
  using (public.is_owner());


-- Register so the GitHub integration treats it as applied.
insert into supabase_migrations.schema_migrations (version, name)
values ('20260713000002','jobs_recurrences') on conflict (version) do nothing;
