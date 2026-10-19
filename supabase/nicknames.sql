-- =============================================================================
-- pizzacalculator.se — nicknames instead of Google names
--
-- Nobody's Google name or photo is shown any more. People choose a nickname
-- the first time they share a pizza (and can change it on the Account page);
-- showing their Google profile picture is opt-in.
--
-- Run once in Supabase → SQL Editor → New query → paste → Run. Safe to re-run.
-- Requires schema.sql, photos.sql and community.sql.
-- =============================================================================

-- New accounts start without a public name or picture.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

-- Existing accounts: drop the copied Google names/pictures (one-time reset).
-- Comment this out if you re-run the script after people have chosen nicknames.
update public.profiles set display_name = null, avatar_url = null
where display_name is not null or avatar_url is not null;

-- Nickname rules: 2–30 characters, no leading/trailing spaces, unique (case-insensitive).
alter table public.profiles drop constraint if exists profiles_display_name_valid;
alter table public.profiles add constraint profiles_display_name_valid
  check (display_name is null or (char_length(display_name) between 2 and 30 and display_name = btrim(display_name)));

create unique index if not exists profiles_display_name_unique on public.profiles (lower(display_name));

-- The picture may only be the person's own Google profile picture (or none).
alter table public.profiles drop constraint if exists profiles_avatar_google_only;
alter table public.profiles add constraint profiles_avatar_google_only
  check (avatar_url is null or avatar_url like 'https://lh3.googleusercontent.com/%');

-- Sharing a pizza requires a nickname.
create or replace function public.require_nickname_to_share()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.is_public and (tg_op = 'INSERT' or not old.is_public) then
    if not exists (
      select 1 from public.profiles where id = new.user_id and display_name is not null
    ) then
      raise exception 'nickname_required' using hint = 'Choose a nickname before sharing.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists pizzas_require_nickname on public.pizzas;
create trigger pizzas_require_nickname
  before insert or update on public.pizzas
  for each row execute function public.require_nickname_to_share();
