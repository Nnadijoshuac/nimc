-- =============================================================================
-- NIN Support Atlanta: team management (roles, access requests, audit log)
-- Run after 20260930000000_init.sql.
--
--   owner  invite, approve requests, change roles, remove people
--   staff  work the queue; can see who is on the team
--
-- New admins never receive a password from anyone: they get an invite email
-- and choose their own. All team changes go through the `team` edge function
-- (service role), which enforces the rules below; admins cannot write these
-- tables directly.
-- =============================================================================

alter table public.admins
  add column role       text not null default 'staff' check (role in ('owner', 'staff')),
  add column invited_by uuid references auth.users (id) on delete set null;

-- Everyone who was an admin before roles existed is an owner.
update public.admins set role = 'owner';

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins where user_id = auth.uid() and role = 'owner'
  );
$$;

revoke all on function public.is_owner() from public;
grant execute on function public.is_owner() to authenticated;

-- -----------------------------------------------------------------------------
-- Access requests: people asking to join from the sign-in page
-- -----------------------------------------------------------------------------

create table public.access_requests (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  full_name   text not null,
  note        text,
  status      text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  decided_by  uuid references auth.users (id) on delete set null,
  decided_at  timestamptz,
  source_ip   inet,
  created_at  timestamptz not null default now()
);

-- One open request per email.
create unique index access_requests_pending_email_idx
  on public.access_requests (lower(email)) where status = 'pending';
create index access_requests_created_idx on public.access_requests (created_at desc);

-- -----------------------------------------------------------------------------
-- Audit log: who invited, approved, changed or removed whom
-- -----------------------------------------------------------------------------

create table public.team_audit (
  id           bigint generated always as identity primary key,
  action       text not null check (action in (
                 'invited', 'request_received', 'request_approved', 'request_declined',
                 'role_changed', 'removed', 'joined'
               )),
  actor_id     uuid references auth.users (id) on delete set null,
  actor_email  text,
  target_email text not null,
  detail       jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index team_audit_created_idx on public.team_audit (created_at desc);

-- -----------------------------------------------------------------------------
-- Security: owners read requests and the audit log; nobody writes directly.
-- -----------------------------------------------------------------------------

alter table public.access_requests enable row level security;
alter table public.team_audit enable row level security;

create policy "owners read requests" on public.access_requests
  for select to authenticated using (public.is_owner());
create policy "owners read audit" on public.team_audit
  for select to authenticated using (public.is_owner());

alter publication supabase_realtime add table public.access_requests;
