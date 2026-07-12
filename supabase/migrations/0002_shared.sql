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
