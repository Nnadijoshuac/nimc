-- =============================================================================
-- NIN Support Atlanta: complete database schema (run once, on a fresh project)
--
--   Supabase dashboard -> SQL Editor -> New query -> paste this file -> Run
--   (or: npx supabase db push)
--
-- What it holds
--   visitors / sessions / analytics_events   every visit, page and funnel step
--   form_drafts                               forms captured piece by piece, from the
--                                             first usable contact detail onwards
--   submissions                               completed forms (the work queue)
--   submission_events                         one activity timeline for drafts and
--                                             submissions: notes, emails, status
--   admins                                    staff allowed into /admin
--
-- Security model
--   The public site never touches these tables directly. It posts to edge
--   functions (track, save-draft, submit-form) that run with the service role.
--   Anonymous users have no access at all; admins get read access plus a few
--   workflow columns through row level security.
-- =============================================================================

-- gen_random_uuid() is built into Postgres 13+, so no extensions are required.

-- -----------------------------------------------------------------------------
-- Types
-- -----------------------------------------------------------------------------

create type public.submission_kind as enum ('pre_enrollment', 'appointment');

create type public.submission_status as enum (
  'new',          -- just came in, nobody has touched it
  'contacted',    -- staff reached out
  'in_progress',  -- documents / payment / biometrics under way
  'completed',    -- enrolment or visit done
  'cancelled'     -- withdrew, duplicate, spam
);

create type public.draft_status as enum (
  'open',       -- in progress or abandoned, nobody has reached out yet
  'contacted',  -- staff reached out
  'converted',  -- they finished and submitted
  'dismissed'   -- not worth following up (test, spam, duplicate)
);

-- -----------------------------------------------------------------------------
-- Admins
-- -----------------------------------------------------------------------------

create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  full_name  text,              -- used as the signature on emails from the dashboard
  created_at timestamptz not null default now()
);

-- security definer so policies can call it without recursing into admins' own RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Visitors and sessions
-- -----------------------------------------------------------------------------
-- IDs are random UUIDs generated in the browser: the visitor id lives in
-- localStorage, the session id in sessionStorage with a 30 minute idle timeout.

create table public.visitors (
  id                 uuid primary key,
  first_seen_at      timestamptz not null default now(),
  last_seen_at       timestamptz not null default now(),
  session_count      int not null default 0,
  first_referrer     text,
  first_source       text,     -- utm_source, else referring host, else 'direct'
  first_medium       text,     -- utm_medium, else organic / social / referral
  first_campaign     text,
  first_landing_path text,
  device             text,     -- mobile | tablet | desktop
  browser            text,
  os                 text,
  -- Filled as soon as they give contact details in any form.
  email              text,
  phone              text,
  full_name          text,
  submission_count   int not null default 0
);

create index visitors_last_seen_idx on public.visitors (last_seen_at desc);
create index visitors_email_idx on public.visitors (lower(email)) where email is not null;

create table public.sessions (
  id            uuid primary key,
  visitor_id    uuid not null references public.visitors (id) on delete cascade,
  started_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  landing_path  text,
  referrer      text,
  source        text,
  medium        text,
  campaign      text,
  device        text,
  browser       text,
  os            text,
  page_views    int not null default 0,
  -- Furthest funnel step reached in this session:
  -- 0 visited, 1 opened a form, 2 started typing, 3 gave contact details, 4 submitted
  funnel_stage  smallint not null default 0
);

create index sessions_started_idx on public.sessions (started_at desc);
create index sessions_visitor_idx on public.sessions (visitor_id, started_at desc);
create index sessions_last_seen_idx on public.sessions (last_seen_at desc);

create table public.analytics_events (
  id          bigint generated always as identity primary key,
  visitor_id  uuid not null references public.visitors (id) on delete cascade,
  session_id  uuid not null references public.sessions (id) on delete cascade,
  name        text not null check (name in (
                'page_view',       -- navigated to a page
                'cta_click',       -- clicked a call to action (props.label)
                'form_open',       -- opened a form
                'form_start',      -- typed into the first field
                'form_step',       -- moved to a form step (props.step)
                'contact_captured',-- gave usable contact details (server-side)
                'form_error',      -- validation or server error (props.field, props.message)
                'form_close',      -- closed a form without submitting (props.step, props.last_field)
                'form_resume',     -- reopened a form from a resume link
                'form_submit'      -- submitted (server-side)
              )),
  form_kind   public.submission_kind,
  path        text,
  props       jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index analytics_events_created_idx on public.analytics_events (created_at desc);
create index analytics_events_session_idx on public.analytics_events (session_id, created_at);
create index analytics_events_visitor_idx on public.analytics_events (visitor_id, created_at);
create index analytics_events_name_idx on public.analytics_events (name, created_at desc);

-- -----------------------------------------------------------------------------
-- Form drafts: every form, captured piece by piece
-- -----------------------------------------------------------------------------
-- A draft is created the moment a form holds a valid email OR phone number and
-- keeps updating as the applicant types. If they never submit, staff can see
-- exactly who they are and how far they got, and reach out by name.

create table public.form_drafts (
  id               uuid primary key,   -- made in the browser; doubles as the resume-link token
  kind             public.submission_kind not null,
  status           public.draft_status not null default 'open',
  visitor_id       uuid references public.visitors (id) on delete set null,
  session_id       uuid references public.sessions (id) on delete set null,
  first_name       text,
  full_name        text,
  email            text,
  phone            text,
  whatsapp         boolean not null default false,
  data             jsonb not null default '{}'::jsonb,  -- every field typed so far
  step             smallint not null default 1,         -- furthest form step reached
  last_field       text,                                -- last field they touched
  fields_completed smallint not null default 0,
  fields_total     smallint not null default 0,
  submission_id    uuid,                                -- set when converted (FK added below)
  converted_at     timestamptz,
  assigned_to      uuid references public.admins (user_id) on delete set null,
  last_contacted_at timestamptz,
  resume_count     int not null default 0,
  source_ip        inet,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint form_drafts_reachable check (email is not null or phone is not null)
);

create index form_drafts_updated_idx on public.form_drafts (updated_at desc);
create index form_drafts_status_idx on public.form_drafts (status, updated_at desc);
create index form_drafts_email_idx on public.form_drafts (lower(email)) where email is not null;
create index form_drafts_visitor_idx on public.form_drafts (visitor_id);

create trigger form_drafts_touch_updated_at
  before update on public.form_drafts
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Submissions: completed forms
-- -----------------------------------------------------------------------------

create sequence public.submission_reference_seq start 1001;

create table public.submissions (
  id               uuid primary key default gen_random_uuid(),
  kind             public.submission_kind not null,
  reference        text not null unique,          -- PE-2026-01001 / AP-2026-01002, set by trigger
  status           public.submission_status not null default 'new',

  first_name       text not null,
  full_name        text not null,
  email            text not null,
  phone            text not null,
  whatsapp         boolean not null default false,

  -- Appointment-only, top level so staff can filter by visit day.
  appointment_date date,
  appointment_time text,

  -- Everything else the form collected (passport no., DOB, service, notes...).
  details          jsonb not null default '{}'::jsonb,

  -- Where they came from.
  visitor_id       uuid references public.visitors (id) on delete set null,
  session_id       uuid references public.sessions (id) on delete set null,
  draft_id         uuid references public.form_drafts (id) on delete set null,

  assigned_to      uuid references public.admins (user_id) on delete set null,
  last_contacted_at timestamptz,
  source_ip        inet,
  user_agent       text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index submissions_created_at_idx on public.submissions (created_at desc);
create index submissions_status_idx on public.submissions (status);
create index submissions_kind_idx on public.submissions (kind);
create index submissions_email_idx on public.submissions (lower(email));
create index submissions_visitor_idx on public.submissions (visitor_id);
create index submissions_appointment_date_idx on public.submissions (appointment_date)
  where appointment_date is not null;

alter table public.form_drafts
  add constraint form_drafts_submission_fk
  foreign key (submission_id) references public.submissions (id) on delete set null;

create or replace function public.set_submission_reference()
returns trigger
language plpgsql
as $$
begin
  if new.reference is null or new.reference = '' then
    new.reference :=
      case new.kind when 'pre_enrollment' then 'PE' else 'AP' end
      || '-' || to_char(now() at time zone 'America/New_York', 'YYYY')
      || '-' || lpad(nextval('public.submission_reference_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;

create trigger submissions_set_reference
  before insert on public.submissions
  for each row execute function public.set_submission_reference();

create trigger submissions_touch_updated_at
  before update on public.submissions
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Activity timeline (drafts and submissions)
-- -----------------------------------------------------------------------------

create table public.submission_events (
  id            uuid primary key default gen_random_uuid(),
  submission_id uuid references public.submissions (id) on delete cascade,
  draft_id      uuid references public.form_drafts (id) on delete cascade,
  type          text not null check (type in (
                  'created', 'note', 'status_change', 'email_sent',
                  'email_failed', 'assigned', 'system'
                )),
  body          text,
  meta          jsonb not null default '{}'::jsonb,
  actor_id      uuid references auth.users (id) on delete set null,
  actor_email   text,
  created_at    timestamptz not null default now(),
  constraint submission_events_one_target
    check ((submission_id is null) <> (draft_id is null))
);

create index submission_events_submission_idx
  on public.submission_events (submission_id, created_at desc) where submission_id is not null;
create index submission_events_draft_idx
  on public.submission_events (draft_id, created_at desc) where draft_id is not null;

-- Log status and assignment changes automatically, whoever makes them.
create or replace function public.log_workflow_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_email text;
  target_submission uuid;
  target_draft uuid;
begin
  select email into actor_email from public.admins where user_id = auth.uid();

  if tg_table_name = 'submissions' then
    target_submission := new.id;
  else
    target_draft := new.id;
  end if;

  if new.status is distinct from old.status then
    insert into public.submission_events (submission_id, draft_id, type, meta, actor_id, actor_email)
    values (target_submission, target_draft, 'status_change',
            jsonb_build_object('from', old.status, 'to', new.status),
            auth.uid(), actor_email);
  end if;

  if new.assigned_to is distinct from old.assigned_to then
    insert into public.submission_events (submission_id, draft_id, type, body, meta, actor_id, actor_email)
    values (target_submission, target_draft, 'assigned',
            (select email from public.admins where user_id = new.assigned_to),
            jsonb_build_object('from', old.assigned_to, 'to', new.assigned_to),
            auth.uid(), actor_email);
  end if;

  return new;
end;
$$;

create trigger submissions_log_changes
  after update on public.submissions
  for each row execute function public.log_workflow_changes();

create trigger form_drafts_log_changes
  after update on public.form_drafts
  for each row execute function public.log_workflow_changes();

-- -----------------------------------------------------------------------------
-- Row level security
-- -----------------------------------------------------------------------------

alter table public.admins            enable row level security;
alter table public.visitors          enable row level security;
alter table public.sessions          enable row level security;
alter table public.analytics_events  enable row level security;
alter table public.form_drafts       enable row level security;
alter table public.submissions       enable row level security;
alter table public.submission_events enable row level security;

create policy "admins read team"        on public.admins            for select to authenticated using (public.is_admin());
create policy "admins read visitors"    on public.visitors          for select to authenticated using (public.is_admin());
create policy "admins read sessions"    on public.sessions          for select to authenticated using (public.is_admin());
create policy "admins read events"      on public.analytics_events  for select to authenticated using (public.is_admin());
create policy "admins read drafts"      on public.form_drafts       for select to authenticated using (public.is_admin());
create policy "admins read submissions" on public.submissions       for select to authenticated using (public.is_admin());
create policy "admins read activity"    on public.submission_events for select to authenticated using (public.is_admin());

create policy "admins update drafts" on public.form_drafts
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete drafts" on public.form_drafts
  for delete to authenticated using (public.is_admin());
create policy "admins update submissions" on public.submissions
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete submissions" on public.submissions
  for delete to authenticated using (public.is_admin());

-- Admins add notes as themselves; every other event type comes from triggers
-- and edge functions running with elevated privileges.
create policy "admins add notes" on public.submission_events
  for insert to authenticated
  with check (public.is_admin() and type = 'note' and actor_id = auth.uid());

-- Staff may move records through the workflow but never rewrite what the
-- applicant submitted.
revoke update on public.submissions from authenticated;
grant update (status, assigned_to) on public.submissions to authenticated;
revoke update on public.form_drafts from authenticated;
grant update (status, assigned_to) on public.form_drafts to authenticated;

-- Live dashboard. RLS applies to realtime too, so only admins receive rows.
alter publication supabase_realtime add table public.submissions;
alter publication supabase_realtime add table public.form_drafts;
alter publication supabase_realtime add table public.submission_events;

-- -----------------------------------------------------------------------------
-- Dashboard analytics: aggregated in Postgres, one round trip per view
-- -----------------------------------------------------------------------------

create or replace function public.analytics_overview(
  p_from timestamptz,
  p_to   timestamptz default now(),
  p_kind public.submission_kind default null
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  with
  s as (select * from sessions where started_at >= p_from and started_at < p_to),
  e as (
    select * from analytics_events
    where created_at >= p_from and created_at < p_to
      and (p_kind is null or form_kind = p_kind or form_kind is null)
  ),
  sub as (
    select * from submissions
    where created_at >= p_from and created_at < p_to and (p_kind is null or kind = p_kind)
  ),
  d as (
    select * from form_drafts
    where created_at >= p_from and created_at < p_to and (p_kind is null or kind = p_kind)
  ),
  funnel as (
    select
      (select count(distinct visitor_id) from s)                                                   as visitors,
      (select count(distinct visitor_id) from e where name = 'form_open')                          as opened,
      (select count(distinct visitor_id) from e where name = 'form_start')                         as started,
      (select count(distinct coalesce(visitor_id::text, lower(email), phone)) from d)              as contact_given,
      (select count(distinct coalesce(visitor_id::text, lower(email))) from sub)                   as submitted
  ),
  days as (
    select generate_series(
      date_trunc('day', p_from at time zone 'America/New_York'),
      date_trunc('day', (p_to - interval '1 second') at time zone 'America/New_York'),
      interval '1 day'
    )::date as day
  ),
  daily as (
    select
      days.day,
      (select count(distinct visitor_id) from s
         where (s.started_at at time zone 'America/New_York')::date = days.day) as visitors,
      (select count(*) from d
         where (d.created_at at time zone 'America/New_York')::date = days.day) as leads,
      (select count(*) from sub
         where (sub.created_at at time zone 'America/New_York')::date = days.day) as submissions
    from days
  ),
  sources as (
    select coalesce(source, 'direct') as label,
           count(distinct visitor_id) as visitors,
           count(distinct visitor_id) filter (where funnel_stage >= 3) as leads,
           count(distinct visitor_id) filter (where funnel_stage >= 4) as submitted
    from s group by 1 order by 2 desc limit 10
  ),
  campaigns as (
    select campaign as label, count(distinct visitor_id) as visitors,
           count(distinct visitor_id) filter (where funnel_stage >= 4) as submitted
    from s where campaign is not null group by 1 order by 2 desc limit 10
  ),
  devices as (
    select coalesce(device, 'unknown') as label,
           count(distinct visitor_id) as visitors,
           count(distinct visitor_id) filter (where funnel_stage >= 4) as submitted
    from s group by 1 order by 2 desc
  ),
  pages as (
    select coalesce(path, '/') as label, count(*) as views, count(distinct visitor_id) as visitors
    from e where name = 'page_view' group by 1 order by 2 desc limit 10
  ),
  ctas as (
    select coalesce(props->>'label', 'unknown') as label, count(*) as clicks
    from e where name = 'cta_click' group by 1 order by 2 desc limit 10
  ),
  dropoff as (
    select kind, coalesce(last_field, 'contact') as label, step, count(*) as drafts
    from d where status in ('open', 'contacted')
    group by 1, 2, 3 order by 4 desc limit 12
  ),
  errors as (
    select coalesce(props->>'field', 'server') as label, count(*) as errors
    from e where name = 'form_error' group by 1 order by 2 desc limit 8
  ),
  hours as (
    select extract(hour from (created_at at time zone 'America/New_York'))::int as hour,
           count(*) as submissions
    from sub group by 1
  )
  select jsonb_build_object(
    'totals', jsonb_build_object(
      'visitors',       (select visitors from funnel),
      'new_visitors',   (select count(*) from visitors v where v.first_seen_at >= p_from and v.first_seen_at < p_to),
      'sessions',       (select count(*) from s),
      'page_views',     (select coalesce(sum(page_views), 0) from s),
      'avg_session_s',  (select coalesce(round(avg(extract(epoch from (last_seen_at - started_at)))), 0) from s),
      'leads',          (select count(*) from d),
      'abandoned',      (select count(*) from d where status in ('open', 'contacted') and updated_at < now() - interval '30 minutes'),
      'recovered',      (select count(*) from d where status = 'converted' and last_contacted_at is not null),
      'submissions',    (select count(*) from sub),
      'completed',      (select count(*) from sub where status = 'completed'),
      'median_minutes_to_submit', (
        select round(percentile_cont(0.5) within group (
          order by extract(epoch from (sub.created_at - v.first_seen_at)) / 60)::numeric, 1)
        from sub join visitors v on v.id = sub.visitor_id
      ),
      'live_now',       (select count(*) from sessions where last_seen_at > now() - interval '5 minutes')
    ),
    'funnel',    (select to_jsonb(funnel) from funnel),
    'daily',     coalesce((select jsonb_agg(to_jsonb(daily) order by day) from daily), '[]'::jsonb),
    'sources',   coalesce((select jsonb_agg(to_jsonb(sources)) from sources), '[]'::jsonb),
    'campaigns', coalesce((select jsonb_agg(to_jsonb(campaigns)) from campaigns), '[]'::jsonb),
    'devices',   coalesce((select jsonb_agg(to_jsonb(devices)) from devices), '[]'::jsonb),
    'pages',     coalesce((select jsonb_agg(to_jsonb(pages)) from pages), '[]'::jsonb),
    'ctas',      coalesce((select jsonb_agg(to_jsonb(ctas)) from ctas), '[]'::jsonb),
    'dropoff',   coalesce((select jsonb_agg(to_jsonb(dropoff)) from dropoff), '[]'::jsonb),
    'errors',    coalesce((select jsonb_agg(to_jsonb(errors)) from errors), '[]'::jsonb),
    'hours',     coalesce((select jsonb_agg(to_jsonb(hours) order by hour) from hours), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.analytics_overview(timestamptz, timestamptz, public.submission_kind) from public;
grant execute on function public.analytics_overview(timestamptz, timestamptz, public.submission_kind) to authenticated;

-- -----------------------------------------------------------------------------
-- Retention. Raw events older than 13 months are not needed by the dashboard;
-- drafts nobody pursued are removed after 6 months. Schedule with pg_cron:
--   select cron.schedule('prune-analytics', '0 4 * * *', 'select public.prune_analytics()');
-- -----------------------------------------------------------------------------

create or replace function public.prune_analytics()
returns void
language sql
security definer
set search_path = public
as $$
  delete from analytics_events where created_at < now() - interval '13 months';
  delete from form_drafts
    where status in ('open', 'dismissed') and updated_at < now() - interval '6 months';
$$;

revoke all on function public.prune_analytics() from public;
