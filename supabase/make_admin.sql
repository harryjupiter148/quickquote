-- Promote an existing account to Administrator.
-- 1) Register the account normally on /register.
-- 2) Replace the email below and run this in Supabase -> SQL Editor.
-- 3) Log out and log back in.

update public.users
   set role = 'admin'
 where email = 'harryjupiter148@gmail.com';
