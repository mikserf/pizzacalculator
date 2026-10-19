-- Make an account an admin (can open /admin and hide community pizzas).
-- Replace the address with the Google email the admin logs in with, then run in
-- Supabase → SQL Editor → New query. Expected result: "Success. 1 row affected".
update public.profiles set is_admin = true
where id = (select id from auth.users where email = 'admin@example.com');
