-- =============================================================================
-- pizzacalculator.se — Phase 3: pizza photos (Supabase Storage)
--
-- Run once in Supabase → SQL Editor → New query → paste → Run.
-- Safe to re-run. Requires schema.sql to have been run first.
-- =============================================================================

-- Public bucket: anyone can view a photo by its URL (needed for the community
-- feed later), but only the owner can add, replace or delete files.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pizza-images', 'pizza-images', true, 2097152, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Files live under "<user id>/<file>", so the first folder must be your own id.
drop policy if exists "Pizza images: owners can read their folder" on storage.objects;
create policy "Pizza images: owners can read their folder"
  on storage.objects for select to authenticated
  using (bucket_id = 'pizza-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Pizza images: owners can upload to their folder" on storage.objects;
create policy "Pizza images: owners can upload to their folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'pizza-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Pizza images: owners can replace their files" on storage.objects;
create policy "Pizza images: owners can replace their files"
  on storage.objects for update to authenticated
  using (bucket_id = 'pizza-images' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'pizza-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Pizza images: owners can delete their files" on storage.objects;
create policy "Pizza images: owners can delete their files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'pizza-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- A pizza may only point at a photo in its owner's own folder.
alter table public.pizzas drop constraint if exists pizzas_image_path_owner;
alter table public.pizzas add constraint pizzas_image_path_owner
  check (image_path is null or split_part(image_path, '/', 1) = user_id::text);
