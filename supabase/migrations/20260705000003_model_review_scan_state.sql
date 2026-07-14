create table public.model_review_scan_states (
  project_id text primary key references public.projects(id) on delete cascade,
  status text not null check (status in ('not_scanned', 'scanned_with_findings')),
  pending_scan_token uuid,
  updated_by_user_id uuid references public.demo_users(id),
  last_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger model_review_scan_states_set_updated_at
before update on public.model_review_scan_states
for each row execute function public.app_set_updated_at();

insert into public.model_review_scan_states (project_id, status)
select p.id, 'not_scanned'
from public.projects p
on conflict (project_id) do nothing;

alter table public.model_review_scan_states enable row level security;

revoke all privileges on table public.model_review_scan_states from public, anon, authenticated;
grant select on table public.model_review_scan_states to authenticated;
grant select, insert, update, delete on table public.model_review_scan_states to service_role;

create policy model_review_scan_states_select_member_projects
on public.model_review_scan_states
for select
to authenticated
using (public.app_is_project_member(project_id));

create or replace function public.begin_model_review_scan(
  project_id text,
  scan_token uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  current_user_id uuid;
  scan_state_row public.model_review_scan_states%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authenticated user required' using errcode = '28000';
  end if;

  current_user_id := public.app_current_demo_user_id();

  if current_user_id is null then
    raise exception 'Authenticated demo user profile not found' using errcode = '28000';
  end if;

  if not public.app_is_project_member($1) then
    raise exception 'Project membership required' using errcode = '42501';
  end if;

  insert into public.model_review_scan_states (
    project_id,
    status,
    pending_scan_token,
    updated_by_user_id
  )
  values (
    $1,
    'not_scanned',
    $2,
    current_user_id
  )
  on conflict (project_id) do update
  set status = 'not_scanned',
      pending_scan_token = excluded.pending_scan_token,
      updated_by_user_id = excluded.updated_by_user_id
  returning * into scan_state_row;

  return jsonb_build_object(
    'scan_state', to_jsonb(scan_state_row),
    'review_history_event', null
  );
end;
$$;

create or replace function public.complete_model_review_scan(
  project_id text,
  scan_token uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  current_user_id uuid;
  scan_state_row public.model_review_scan_states%rowtype;
  updated_scan_state_row public.model_review_scan_states%rowtype;
  scan_row public.ai_scan_runs%rowtype;
  review_event_row public.review_history_events%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authenticated user required' using errcode = '28000';
  end if;

  current_user_id := public.app_current_demo_user_id();

  if current_user_id is null then
    raise exception 'Authenticated demo user profile not found' using errcode = '28000';
  end if;

  if not public.app_is_project_member($1) then
    raise exception 'Project membership required' using errcode = '42501';
  end if;

  select s.*
  into scan_state_row
  from public.model_review_scan_states s
  where s.project_id = $1
  for update;

  if not found then
    raise exception 'Model Review scan state not found for project: %', $1 using errcode = 'P0002';
  end if;

  if scan_state_row.pending_scan_token is null
    or scan_state_row.pending_scan_token <> $2 then
    raise exception 'Model Review scan completion token is stale or cancelled' using errcode = '40001';
  end if;

  select sr.*
  into scan_row
  from public.ai_scan_runs sr
  where sr.project_id = $1
    and sr.status = 'completed'
    and sr.source in ('seed', 'mock')
    and exists (
      select 1
      from public.ai_findings af
      where af.project_id = sr.project_id
        and af.scan_run_id = sr.id
    )
  order by sr.completed_at desc nulls last, sr.created_at desc
  limit 1;

  if not found then
    raise exception 'Completed seeded Model Review scan run not found for project: %', $1 using errcode = 'P0002';
  end if;

  update public.model_review_scan_states
  set status = 'scanned_with_findings',
      pending_scan_token = null,
      updated_by_user_id = current_user_id,
      last_completed_at = now()
  where project_id = scan_state_row.project_id
  returning * into updated_scan_state_row;

  insert into public.review_history_events (
    project_id,
    event_type,
    actor_user_id,
    scan_run_id,
    label,
    detail
  )
  values (
    scan_row.project_id,
    'scan_completed',
    current_user_id,
    scan_row.id,
    'AI scan completed',
    scan_row.finding_count::text || ' coordination findings available'
  )
  returning * into review_event_row;

  return jsonb_build_object(
    'scan_state', to_jsonb(updated_scan_state_row),
    'review_history_event', to_jsonb(review_event_row)
  );
end;
$$;

create or replace function public.clear_model_review_scan_results(
  project_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  current_user_id uuid;
  scan_state_row public.model_review_scan_states%rowtype;
  updated_scan_state_row public.model_review_scan_states%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authenticated user required' using errcode = '28000';
  end if;

  current_user_id := public.app_current_demo_user_id();

  if current_user_id is null then
    raise exception 'Authenticated demo user profile not found' using errcode = '28000';
  end if;

  if not public.app_is_project_member($1) then
    raise exception 'Project membership required' using errcode = '42501';
  end if;

  select s.*
  into scan_state_row
  from public.model_review_scan_states s
  where s.project_id = $1
  for update;

  if found then
    update public.model_review_scan_states
    set status = 'not_scanned',
        pending_scan_token = null,
        updated_by_user_id = current_user_id
    where project_id = scan_state_row.project_id
    returning * into updated_scan_state_row;
  else
    insert into public.model_review_scan_states (
      project_id,
      status,
      pending_scan_token,
      updated_by_user_id
    )
    values (
      $1,
      'not_scanned',
      null,
      current_user_id
    )
    returning * into updated_scan_state_row;
  end if;

  return jsonb_build_object(
    'scan_state', to_jsonb(updated_scan_state_row),
    'review_history_event', null
  );
end;
$$;

revoke all on function public.begin_model_review_scan(text, uuid) from public, anon;
revoke all on function public.complete_model_review_scan(text, uuid) from public, anon;
revoke all on function public.clear_model_review_scan_results(text) from public, anon;

grant execute on function public.begin_model_review_scan(text, uuid) to authenticated;
grant execute on function public.complete_model_review_scan(text, uuid) to authenticated;
grant execute on function public.clear_model_review_scan_results(text) to authenticated;
