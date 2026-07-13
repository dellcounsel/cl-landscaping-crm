-- FieldBook — Migration: quotes (M2)
-- Financial data: owner-only via RLS. Public approval pages never use the
-- user session — they go through a server route using the service-role key
-- that looks up strictly by public_token and returns only safe fields.

create type quote_status as enum (
  'draft', 'sent', 'approved', 'declined', 'expired'
);

create table public.quotes (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.clients (id) on delete cascade,
  status         quote_status not null default 'draft',
  -- line_items: jsonb array of
  --   { description text, qty number, rate_cents int, total_cents int,
  --     price_item_id uuid|null }
  line_items     jsonb not null default '[]'::jsonb,
  subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  tax_rate       numeric(6, 4) not null default 0 check (tax_rate >= 0),
  tax_cents      integer not null default 0 check (tax_cents >= 0),
  total_cents    integer not null default 0 check (total_cents >= 0),
  notes          text,
  public_token   uuid not null default gen_random_uuid(),
  valid_until    date,
  sent_at        timestamptz,
  approved_at    timestamptz,
  declined_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create unique index quotes_public_token_idx on public.quotes (public_token);
create index quotes_client_id_idx on public.quotes (client_id);
create index quotes_status_idx on public.quotes (status);

create trigger quotes_set_updated_at
  before update on public.quotes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — owner only. Crew has no access to quotes (financial). Anonymous/public
-- access is handled server-side with the service-role key, not through RLS.
-- ---------------------------------------------------------------------------
alter table public.quotes enable row level security;

create policy "quotes: owner can read"
  on public.quotes for select
  to authenticated
  using (public.is_owner());

create policy "quotes: owner can insert"
  on public.quotes for insert
  to authenticated
  with check (public.is_owner());

create policy "quotes: owner can update"
  on public.quotes for update
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create policy "quotes: owner can delete"
  on public.quotes for delete
  to authenticated
  using (public.is_owner());
