-- Link public.users to auth.users so deleting an account in
-- Supabase → Authentication → Users also deletes the profile and all its data (cascade).
-- Safe to run more than once.

-- 1) Backfill profiles/settings for any auth user that is missing them.
insert into public.users (id, email, display_name, avatar_url)
select au.id, au.email, au.raw_user_meta_data ->> 'full_name', au.raw_user_meta_data ->> 'avatar_url'
from auth.users au
where not exists (select 1 from public.users u where u.id = au.id)
on conflict do nothing;

insert into public.user_settings (user_id)
select u.id from public.users u
where not exists (select 1 from public.user_settings s where s.user_id = u.id)
on conflict do nothing;

-- 2) Remove orphan profiles (no matching auth user) so the FK can be created.
delete from public.users u where not exists (select 1 from auth.users au where au.id = u.id);

-- 3) Foreign key with cascade delete.
alter table public.users drop constraint if exists users_id_auth_fk;
alter table public.users
  add constraint users_id_auth_fk foreign key (id) references auth.users (id) on delete cascade;

-- 4) Keep the profile email in sync and don't fail sign-up on a stale email row.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update set email = excluded.email;

  insert into public.user_settings (user_id, locale)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'locale', 'vi'))
  on conflict (user_id) do nothing;

  return new;
end;
$$;
