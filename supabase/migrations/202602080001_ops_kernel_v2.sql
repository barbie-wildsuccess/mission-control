create extension if not exists pgcrypto;

create table if not exists public.ops_policy (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.ops_proposals (
  id uuid primary key default gen_random_uuid(),
  trigger text not null,
  agent text not null default 'ops_kernel',
  title text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  risk_level text not null default 'low' check (risk_level in ('low', 'medium', 'high')),
  payload jsonb not null default '{}'::jsonb,
  reason_rejected text,
  created_at timestamptz not null default now()
);

create table if not exists public.ops_missions (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.ops_proposals(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'failed')),
  created_by text not null default 'ops_kernel',
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

create table if not exists public.ops_steps (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.ops_missions(id) on delete cascade,
  proposal_id uuid references public.ops_proposals(id) on delete set null,
  kind text not null,
  status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'failed')),
  payload jsonb not null default '{}'::jsonb,
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

create table if not exists public.ops_events (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid references public.ops_missions(id) on delete set null,
  step_id uuid references public.ops_steps(id) on delete set null,
  proposal_id uuid references public.ops_proposals(id) on delete set null,
  agent text not null default 'ops_kernel',
  kind text not null,
  title text not null,
  summary text not null default '',
  tags text[] not null default '{}'::text[],
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_ops_missions_proposal on public.ops_missions (proposal_id);

create index if not exists idx_ops_proposals_created_at
  on public.ops_proposals (created_at desc);
create index if not exists idx_ops_proposals_status_created_at
  on public.ops_proposals (status, created_at desc);
create index if not exists idx_ops_proposals_trigger_created_at
  on public.ops_proposals (trigger, created_at desc);

create index if not exists idx_ops_missions_status_created_at
  on public.ops_missions (status, created_at desc);

create index if not exists idx_ops_steps_status_created_at
  on public.ops_steps (status, created_at asc);
create index if not exists idx_ops_steps_kind_created_at
  on public.ops_steps (kind, created_at desc);
create index if not exists idx_ops_steps_mission_id
  on public.ops_steps (mission_id);
create index if not exists idx_ops_steps_started_at_running
  on public.ops_steps (started_at)
  where status = 'running';

create index if not exists idx_ops_events_created_at
  on public.ops_events (created_at desc);
create index if not exists idx_ops_events_kind_created_at
  on public.ops_events (kind, created_at desc);
