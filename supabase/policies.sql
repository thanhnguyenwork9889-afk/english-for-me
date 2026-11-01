-- Run this in Supabase Dashboard → SQL Editor AFTER `npm run db:migrate`.
-- 1) Sync auth.users → public.users (+ default settings)
-- 2) Enable Row Level Security so the browser client can only see its own rows.

-- ---------- 1. Auth trigger ----------
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
  on conflict (id) do nothing;

  insert into public.user_settings (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- 2. Row Level Security ----------
alter table public.users              enable row level security;
alter table public.user_settings      enable row level security;
alter table public.roadmaps           enable row level security;
alter table public.phases             enable row level security;
alter table public.lessons            enable row level security;
alter table public.lesson_progress    enable row level security;
alter table public.daily_stats        enable row level security;
alter table public.study_schedules    enable row level security;
alter table public.study_sessions     enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notifications      enable row level security;
alter table public.ai_insights        enable row level security;

-- Tables owned directly by a user
create policy "own row" on public.users
  for all using (id = (select auth.uid())) with check (id = (select auth.uid()));

do $$
declare t text;
begin
  foreach t in array array[
    'user_settings','roadmaps','lesson_progress','daily_stats','study_schedules',
    'study_sessions','push_subscriptions','notifications','ai_insights'
  ] loop
    execute format(
      'create policy "own rows" on public.%I for all
         using (user_id = (select auth.uid()))
         with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- Child tables: ownership via roadmap
create policy "own phases" on public.phases for all
  using (exists (select 1 from public.roadmaps r
                 where r.id = phases.roadmap_id and r.user_id = (select auth.uid())))
  with check (exists (select 1 from public.roadmaps r
                 where r.id = phases.roadmap_id and r.user_id = (select auth.uid())));

create policy "own lessons" on public.lessons for all
  using (exists (select 1 from public.phases p join public.roadmaps r on r.id = p.roadmap_id
                 where p.id = lessons.phase_id and r.user_id = (select auth.uid())))
  with check (exists (select 1 from public.phases p join public.roadmaps r on r.id = p.roadmap_id
                 where p.id = lessons.phase_id and r.user_id = (select auth.uid())));
