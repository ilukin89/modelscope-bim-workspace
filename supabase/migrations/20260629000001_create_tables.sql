create extension if not exists pgcrypto;

create table public.demo_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null check (length(trim(email)) > 0),
  display_name text not null check (length(trim(display_name)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id text primary key check (id in ('residential-tower-a', 'civic-center-east', 'transit-hub-02')),
  name text not null check (length(trim(name)) > 0),
  model_label text not null check (length(trim(model_label)) > 0),
  owner_user_id uuid not null references public.demo_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_memberships (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.demo_users(id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table public.ai_scan_runs (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  created_by_user_id uuid not null references public.demo_users(id),
  status text not null check (status in ('queued', 'running', 'completed', 'failed', 'cancelled')),
  source text not null check (source in ('seed', 'demo', 'mock')),
  started_at timestamptz,
  completed_at timestamptz,
  finding_count integer not null default 0 check (finding_count >= 0),
  created_at timestamptz not null default now(),
  unique (id, project_id)
);

create table public.ai_findings (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  scan_run_id uuid not null,
  fixture_finding_id text not null,
  code text not null check (length(trim(code)) > 0),
  title text not null check (length(trim(title)) > 0),
  finding_type text not null check (finding_type in ('coordination', 'clearance', 'fire-safety', 'annotation')),
  suggested_priority text not null check (suggested_priority in ('critical', 'warning', 'info')),
  confidence numeric check (confidence is null or (confidence >= 0 and confidence <= 1)),
  object_id text,
  object_label text,
  discipline text not null check (discipline in ('architecture', 'structure', 'mechanical', 'electrical')),
  level text,
  location text,
  source_payload jsonb not null default '{}'::jsonb,
  current_status text not null default 'active' check (current_status in ('active', 'issue-created', 'dismissed', 'follow-up')),
  created_at timestamptz not null default now(),
  unique (id, project_id),
  unique (project_id, fixture_finding_id),
  foreign key (scan_run_id, project_id) references public.ai_scan_runs(id, project_id) on delete cascade
);

create table public.model_review_issues (
  id uuid primary key default gen_random_uuid(),
  issue_code text not null unique,
  project_id text not null references public.projects(id) on delete cascade,
  created_by_user_id uuid not null references public.demo_users(id),
  source_finding_id uuid not null,
  source_scan_run_id uuid not null,
  source_finding_code text not null,
  title text not null check (length(trim(title)) > 0),
  related_object text,
  related_level text,
  priority text not null check (priority in ('critical', 'warning', 'info')),
  status text not null check (status in ('Open', 'In Review', 'Resolved', 'Blocked', 'Closed as not actionable')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, project_id),
  foreign key (source_finding_id, project_id) references public.ai_findings(id, project_id),
  foreign key (source_scan_run_id, project_id) references public.ai_scan_runs(id, project_id)
);

create table public.ai_finding_decisions (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  finding_id uuid not null,
  scan_run_id uuid not null,
  user_id uuid not null references public.demo_users(id),
  decision_type text not null check (decision_type in ('create_issue', 'dismiss', 'mark_follow_up', 'restore', 'remove_issue_link')),
  created_issue_id uuid,
  decision_note text,
  idempotency_key uuid,
  created_at timestamptz not null default now(),
  unique (id, project_id),
  foreign key (finding_id, project_id) references public.ai_findings(id, project_id),
  foreign key (scan_run_id, project_id) references public.ai_scan_runs(id, project_id),
  foreign key (created_issue_id, project_id) references public.model_review_issues(id, project_id)
);

create table public.issue_status_history (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  issue_id uuid not null,
  from_status text check (from_status is null or from_status in ('Open', 'In Review', 'Resolved', 'Blocked', 'Closed as not actionable')),
  to_status text not null check (to_status in ('Open', 'In Review', 'Resolved', 'Blocked', 'Closed as not actionable')),
  changed_by_user_id uuid not null references public.demo_users(id),
  change_reason text,
  idempotency_key uuid,
  changed_at timestamptz not null default now(),
  unique (id, project_id),
  foreign key (issue_id, project_id) references public.model_review_issues(id, project_id) on delete cascade
);

create table public.review_history_events (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  event_type text not null check (event_type in ('scan_completed', 'finding_dismissed', 'finding_restored', 'issue_created', 'issue_status_changed', 'issue_link_removed')),
  actor_user_id uuid references public.demo_users(id),
  scan_run_id uuid,
  finding_id uuid,
  issue_id uuid,
  decision_id uuid,
  status_history_id uuid,
  label text not null check (length(trim(label)) > 0),
  detail text not null check (length(trim(detail)) > 0),
  created_at timestamptz not null default now(),
  foreign key (scan_run_id, project_id) references public.ai_scan_runs(id, project_id),
  foreign key (finding_id, project_id) references public.ai_findings(id, project_id),
  foreign key (issue_id, project_id) references public.model_review_issues(id, project_id),
  foreign key (decision_id, project_id) references public.ai_finding_decisions(id, project_id),
  foreign key (status_history_id, project_id) references public.issue_status_history(id, project_id)
);

create unique index model_review_issues_one_active_per_finding_idx
  on public.model_review_issues(source_finding_id)
  where status <> 'Closed as not actionable';

create unique index ai_finding_decisions_idempotency_key_idx
  on public.ai_finding_decisions(idempotency_key)
  where idempotency_key is not null;

create unique index issue_status_history_idempotency_key_idx
  on public.issue_status_history(idempotency_key)
  where idempotency_key is not null;

create sequence public.model_review_issue_residential_tower_a_seq as integer start with 1 increment by 1 no minvalue no maxvalue cache 1;
create sequence public.model_review_issue_civic_center_east_seq as integer start with 1 increment by 1 no minvalue no maxvalue cache 1;
create sequence public.model_review_issue_transit_hub_02_seq as integer start with 1 increment by 1 no minvalue no maxvalue cache 1;

create or replace function public.app_set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger demo_users_set_updated_at
before update on public.demo_users
for each row execute function public.app_set_updated_at();

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.app_set_updated_at();

create trigger model_review_issues_set_updated_at
before update on public.model_review_issues
for each row execute function public.app_set_updated_at();

alter table public.demo_users enable row level security;
alter table public.projects enable row level security;
alter table public.project_memberships enable row level security;
alter table public.ai_scan_runs enable row level security;
alter table public.ai_findings enable row level security;
alter table public.ai_finding_decisions enable row level security;
alter table public.model_review_issues enable row level security;
alter table public.issue_status_history enable row level security;
alter table public.review_history_events enable row level security;
