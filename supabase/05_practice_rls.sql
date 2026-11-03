-- Row Level Security for the practice tables (Phase: exercises + review queue).
-- Run once in the Supabase SQL editor, after the Drizzle migration that creates the tables.
-- Safe to re-run: every statement is guarded.

alter table public.exercises         enable row level security;
alter table public.exercise_attempts enable row level security;
alter table public.review_items      enable row level security;

-- Exercises belong to a lesson → phase → roadmap → user, like phases and lessons do.
drop policy if exists "own exercises" on public.exercises;
create policy "own exercises" on public.exercises for all
  using (exists (select 1
                 from public.lessons l
                 join public.phases p on p.id = l.phase_id
                 join public.roadmaps r on r.id = p.roadmap_id
                 where l.id = exercises.lesson_id and r.user_id = (select auth.uid())))
  with check (exists (select 1
                      from public.lessons l
                      join public.phases p on p.id = l.phase_id
                      join public.roadmaps r on r.id = p.roadmap_id
                      where l.id = exercises.lesson_id and r.user_id = (select auth.uid())));

-- Attempts and review rows carry user_id directly.
do $$
declare t text;
begin
  foreach t in array array['exercise_attempts','review_items'] loop
    execute format('drop policy if exists "own rows" on public.%I', t);
    execute format(
      'create policy "own rows" on public.%I for all
         using (user_id = (select auth.uid()))
         with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;
