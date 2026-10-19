-- =============================================================================
-- pizzacalculator.se — Phase 4: community (publishing, ratings, reports, admin)
--
-- Run once in Supabase → SQL Editor → New query → paste → Run.
-- Safe to re-run. Requires schema.sql and photos.sql to have been run first.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Admins. Users can still edit their own name/avatar, but never is_admin.
-- -----------------------------------------------------------------------------
alter table public.profiles add column if not exists is_admin boolean not null default false;

revoke update on public.profiles from authenticated, anon;
grant update (display_name, avatar_url) on public.profiles to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- -----------------------------------------------------------------------------
-- Publishing rules: a shared pizza needs a photo. Only admins can un-hide.
-- -----------------------------------------------------------------------------
alter table public.pizzas drop constraint if exists pizzas_public_needs_photo;
alter table public.pizzas add constraint pizzas_public_needs_photo
  check (not is_public or image_path is not null);

create or replace function public.pizzas_before_update()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  if not public.is_admin() then
    new.hidden := old.hidden or new.hidden;
  end if;
  if new.is_public and not old.is_public then
    new.published_at := now();
  end if;
  return new;
end;
$$;

-- Inserting a pizza that is already public also gets a publish time.
create or replace function public.pizzas_before_insert()
returns trigger
language plpgsql
as $$
begin
  if not public.is_admin() then
    new.hidden := false;
  end if;
  new.published_at := case when new.is_public then now() else null end;
  return new;
end;
$$;

drop trigger if exists pizzas_before_insert on public.pizzas;
create trigger pizzas_before_insert
  before insert on public.pizzas
  for each row execute function public.pizzas_before_insert();

-- -----------------------------------------------------------------------------
-- Ratings: one 1–5 score per user per pizza; not on your own pizza; only on
-- published, visible pizzas. Individual votes stay private — the feed only
-- exposes averages and counts.
-- -----------------------------------------------------------------------------
create table if not exists public.ratings (
  pizza_id   uuid not null references public.pizzas (id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  score      smallint not null check (score between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (pizza_id, user_id)
);

create index if not exists ratings_recent_idx on public.ratings (updated_at desc);

alter table public.ratings enable row level security;

drop policy if exists "Users can read their own ratings" on public.ratings;
create policy "Users can read their own ratings"
  on public.ratings for select
  using (user_id = auth.uid());

drop policy if exists "Users can rate other people's published pizzas" on public.ratings;
create policy "Users can rate other people's published pizzas"
  on public.ratings for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.pizzas p
      where p.id = pizza_id and p.is_public and not p.hidden and p.user_id <> auth.uid()
    )
  );

drop policy if exists "Users can change their own ratings" on public.ratings;
create policy "Users can change their own ratings"
  on public.ratings for update
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.pizzas p
      where p.id = pizza_id and p.is_public and not p.hidden and p.user_id <> auth.uid()
    )
  );

drop policy if exists "Users can remove their own ratings" on public.ratings;
create policy "Users can remove their own ratings"
  on public.ratings for delete
  using (user_id = auth.uid());

create or replace function public.ratings_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists ratings_touch on public.ratings;
create trigger ratings_touch
  before update on public.ratings
  for each row execute function public.ratings_touch();

-- -----------------------------------------------------------------------------
-- Ranking formulas (plain functions so they can be tested on their own).
-- -----------------------------------------------------------------------------

-- Top rated: Bayesian average. Every pizza starts with 10 imaginary 3.5★ votes,
-- so one 5★ vote can't beat fifty 4.6★ votes.
create or replace function public.bayesian_score(avg_score numeric, rating_count integer)
returns numeric
language sql
immutable
as $$
  select (coalesce(avg_score, 0) * coalesce(rating_count, 0) + 3.5 * 10) / (coalesce(rating_count, 0) + 10);
$$;

-- Trending: each rating from the last 7 days counts (score − 1) / 4 — so 1★ adds
-- nothing and 5★ adds 1 — and fades with a 3-day half-life.
create or replace function public.trending_weight(score integer, age_hours numeric)
returns numeric
language sql
immutable
as $$
  select case
    when age_hours < 0 or age_hours > 168 then 0
    else ((score - 1) / 4.0) * power(0.5, age_hours / 72.0)
  end;
$$;

-- -----------------------------------------------------------------------------
-- The community feed. One function serves the three tabs and the pizza page
-- (only_id). Runs as owner so it can aggregate ratings it doesn't expose.
-- -----------------------------------------------------------------------------
drop function if exists public.community_pizzas(text, integer, integer, uuid);
create or replace function public.community_pizzas(
  sort text default 'latest',
  lim integer default 24,
  off integer default 0,
  only_id uuid default null
)
returns table (
  id uuid,
  name text,
  description jsonb,
  ingredients jsonb,
  image_path text,
  published_at timestamptz,
  author_id uuid,
  author_name text,
  author_avatar text,
  avg_score numeric,
  rating_count integer,
  rank_score numeric
)
language sql
stable
security definer set search_path = ''
as $$
  with stats as (
    select
      r.pizza_id,
      avg(r.score)::numeric as avg_score,
      count(*)::integer as rating_count,
      sum(public.trending_weight(r.score, extract(epoch from (now() - r.updated_at)) / 3600)) as trend
    from public.ratings r
    group by r.pizza_id
  )
  select
    p.id, p.name, p.description, p.ingredients, p.image_path, p.published_at,
    p.user_id, pr.display_name, pr.avatar_url,
    round(coalesce(s.avg_score, 0), 2), coalesce(s.rating_count, 0),
    case sort
      when 'top' then public.bayesian_score(s.avg_score, s.rating_count)
      when 'trending' then coalesce(s.trend, 0)
      else extract(epoch from p.published_at)::numeric
    end as rank_score
  from public.pizzas p
  left join stats s on s.pizza_id = p.id
  left join public.profiles pr on pr.id = p.user_id
  where p.is_public and not p.hidden and (only_id is null or p.id = only_id)
  order by rank_score desc nulls last, p.published_at desc
  limit least(greatest(lim, 1), 60) offset greatest(off, 0);
$$;

grant execute on function public.community_pizzas(text, integer, integer, uuid) to anon, authenticated;
grant execute on function public.bayesian_score(numeric, integer) to anon, authenticated;
grant execute on function public.trending_weight(integer, numeric) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Reports + admin tools.
-- -----------------------------------------------------------------------------
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  pizza_id    uuid not null references public.pizzas (id) on delete cascade,
  reporter_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  reason      text not null check (char_length(reason) between 1 and 500),
  resolved    boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (pizza_id, reporter_id)
);

alter table public.reports enable row level security;

drop policy if exists "Users can report published pizzas" on public.reports;
create policy "Users can report published pizzas"
  on public.reports for insert to authenticated
  with check (
    reporter_id = auth.uid()
    and exists (select 1 from public.pizzas p where p.id = pizza_id and p.is_public)
  );

drop policy if exists "Admins can read reports" on public.reports;
create policy "Admins can read reports"
  on public.reports for select
  using (public.is_admin());

drop policy if exists "Admins can resolve reports" on public.reports;
create policy "Admins can resolve reports"
  on public.reports for update
  using (public.is_admin())
  with check (public.is_admin());

-- Admin moderation list: open reports and hidden pizzas, newest first.
create or replace function public.admin_moderation()
returns table (
  pizza_id uuid,
  name text,
  image_path text,
  author_name text,
  hidden boolean,
  is_public boolean,
  open_reports integer,
  reasons text[],
  last_report timestamptz
)
language plpgsql
stable
security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;
  return query
    select p.id, p.name, p.image_path, pr.display_name, p.hidden, p.is_public,
           count(r.id) filter (where not r.resolved)::integer,
           coalesce(array_agg(r.reason order by r.created_at desc) filter (where not r.resolved), '{}'),
           max(r.created_at)
    from public.pizzas p
    left join public.reports r on r.pizza_id = p.id
    left join public.profiles pr on pr.id = p.user_id
    group by p.id, pr.display_name
    having p.hidden or count(r.id) filter (where not r.resolved) > 0
    order by max(r.created_at) desc nulls last;
end;
$$;

-- Hide or un-hide a pizza; hiding or keeping it also resolves its open reports.
create or replace function public.admin_set_hidden(target uuid, hide boolean)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;
  update public.pizzas set hidden = hide where id = target;
  update public.reports set resolved = true where pizza_id = target and not resolved;
end;
$$;

revoke all on function public.admin_moderation() from public, anon;
revoke all on function public.admin_set_hidden(uuid, boolean) from public, anon;
grant execute on function public.admin_moderation() to authenticated;
grant execute on function public.admin_set_hidden(uuid, boolean) to authenticated;
grant execute on function public.is_admin() to anon, authenticated;
