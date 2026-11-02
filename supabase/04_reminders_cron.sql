-- Study reminders: call the app's cron endpoint every minute from Supabase (free plan).
-- Run in Supabase Dashboard → SQL Editor AFTER the app is deployed (e.g. on Vercel).
--
-- BEFORE RUNNING, replace the two placeholders below:
--   <APP_URL>      your deployed URL, e.g. https://english-for-me.vercel.app   (no trailing slash)
--   <CRON_SECRET>  the CRON_SECRET value from your Vercel environment variables
-- Safe to re-run (it replaces the secrets and the job).

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Keep the URL and secret in Supabase Vault (encrypted) instead of in the job text.
do $$
begin
  perform vault.update_secret(id, '<APP_URL>') from vault.secrets where name = 'reminders_app_url';
  if not found then perform vault.create_secret('<APP_URL>', 'reminders_app_url'); end if;

  perform vault.update_secret(id, '<CRON_SECRET>') from vault.secrets where name = 'reminders_cron_secret';
  if not found then perform vault.create_secret('<CRON_SECRET>', 'reminders_cron_secret'); end if;
end $$;

-- (Re)create the every-minute job.
select cron.unschedule(jobid) from cron.job where jobname = 'study-reminders';

select cron.schedule(
  'study-reminders',
  '* * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'reminders_app_url') || '/api/cron/reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'reminders_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
  $$
);

-- Check it's running (after a minute or two):
--   select * from cron.job_run_details where jobid = (select jobid from cron.job where jobname = 'study-reminders') order by start_time desc limit 5;
--   select status_code, content from net._http_response order by created desc limit 5;
-- Stop it:
--   select cron.unschedule('study-reminders');
