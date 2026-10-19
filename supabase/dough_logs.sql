-- =============================================================================
-- pizzacalculator.se — dough protocols (Degprotokoll), private per user
--
-- Run once in Supabase → SQL Editor → New query → paste → Run. Safe to re-run.
-- Requires schema.sql.
-- =============================================================================

create table if not exists public.dough_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  baked_on   date,
  title      text check (title is null or char_length(title) <= 120),
  -- Snapshot of the calculator recipe the dough was made with.
  recipe     jsonb not null default '{}'::jsonb,
  -- The filled-in protocol (temperatures, clocks, handling, result, notes).
  protocol   jsonb not null default '{}'::jsonb check (pg_column_size(protocol) < 32000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dough_logs_user_idx on public.dough_logs (user_id, baked_on desc, created_at desc);

alter table public.dough_logs enable row level security;

-- Private: only the owner can see or change their protocols.
drop policy if exists "Owners can read their dough logs" on public.dough_logs;
create policy "Owners can read their dough logs"
  on public.dough_logs for select using (user_id = auth.uid());

drop policy if exists "Owners can add dough logs" on public.dough_logs;
create policy "Owners can add dough logs"
  on public.dough_logs for insert with check (user_id = auth.uid());

drop policy if exists "Owners can update their dough logs" on public.dough_logs;
create policy "Owners can update their dough logs"
  on public.dough_logs for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Owners can delete their dough logs" on public.dough_logs;
create policy "Owners can delete their dough logs"
  on public.dough_logs for delete using (user_id = auth.uid());

create or replace function public.dough_logs_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists dough_logs_touch on public.dough_logs;
create trigger dough_logs_touch
  before update on public.dough_logs
  for each row execute function public.dough_logs_touch();
