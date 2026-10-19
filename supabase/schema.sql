-- =============================================================================
-- pizzacalculator.se — database schema (Phase 2: accounts + cloud pizzas)
--
-- Run once in Supabase → SQL Editor → New query → paste → Run.
-- Safe to re-run: every statement is idempotent.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Profiles: public display info only. Emails stay in auth.users and are never
-- exposed through the API.
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are readable by everyone" on public.profiles;
create policy "Profiles are readable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Create a profile automatically when someone signs up (Google gives name + avatar).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Pizzas: each user's own pizzas. The image/community columns are used by
-- later phases but created now so no migration is needed.
-- -----------------------------------------------------------------------------
create table if not exists public.pizzas (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 60),
  description  jsonb not null default '{"sv": "", "en": ""}'::jsonb,
  ingredients  jsonb not null default '[]'::jsonb check (jsonb_typeof(ingredients) = 'array'),
  image_path   text,
  is_public    boolean not null default false,
  published_at timestamptz,
  hidden       boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists pizzas_user_id_idx on public.pizzas (user_id, created_at);
create index if not exists pizzas_public_idx on public.pizzas (published_at desc) where is_public and not hidden;

alter table public.pizzas enable row level security;

drop policy if exists "Owners can read their pizzas" on public.pizzas;
create policy "Owners can read their pizzas"
  on public.pizzas for select
  using (user_id = auth.uid());

drop policy if exists "Anyone can read published pizzas" on public.pizzas;
create policy "Anyone can read published pizzas"
  on public.pizzas for select
  using (is_public and not hidden);

drop policy if exists "Owners can insert pizzas" on public.pizzas;
create policy "Owners can insert pizzas"
  on public.pizzas for insert
  with check (user_id = auth.uid());

drop policy if exists "Owners can update their pizzas" on public.pizzas;
create policy "Owners can update their pizzas"
  on public.pizzas for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Owners can delete their pizzas" on public.pizzas;
create policy "Owners can delete their pizzas"
  on public.pizzas for delete
  using (user_id = auth.uid());

-- Users may not un-hide a pizza an admin hid.
create or replace function public.pizzas_before_update()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  new.hidden := old.hidden or new.hidden;
  if new.is_public and not old.is_public then
    new.published_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists pizzas_before_update on public.pizzas;
create trigger pizzas_before_update
  before update on public.pizzas
  for each row execute function public.pizzas_before_update();

-- -----------------------------------------------------------------------------
-- GDPR: "Delete my account and data". Deleting the auth user cascades to
-- profiles and pizzas. (Photos in Storage are removed by the app first.)
-- -----------------------------------------------------------------------------
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
