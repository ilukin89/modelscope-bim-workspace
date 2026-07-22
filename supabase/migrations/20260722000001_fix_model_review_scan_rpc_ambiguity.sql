-- Keep the public argument names stable for PostgREST/Supabase RPC callers.
-- Internal p_* aliases prevent argument names from colliding with table columns.

create or replace function public.begin_model_review_scan(
  project_id text,
  scan_token uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
#variable_conflict error
declare
  p_project_id alias for $1;
  p_scan_token alias for $2;
  v_current_user_id uuid;
  v_scan_state_row public.model_review_scan_states%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authenticated user required' using errcode = '28000';
  end if;

  v_current_user_id := public.app_current_demo_user_id();

  if v_current_user_id is null then
    raise exception 'Authenticated demo user profile not found' using errcode = '28000';
  end if;

  if not public.app_is_project_member(p_project_id) then
    raise exception 'Project membership required' using errcode = '42501';
  end if;

  insert into public.model_review_scan_states as scan_states (
    project_id,
    status,
    pending_scan_token,
    updated_by_user_id
  )
  values (
    p_project_id,
    'not_scanned',
    p_scan_token,
    v_current_user_id
  )
  on conflict on constraint model_review_scan_states_pkey do update
  set status = 'not_scanned',
      pending_scan_token = excluded.pending_scan_token,
      updated_by_user_id = excluded.updated_by_user_id
  returning scan_states.* into v_scan_state_row;

  return jsonb_build_object(
    'scan_state', to_jsonb(v_scan_state_row),
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
#variable_conflict error
declare
  p_project_id alias for $1;
  p_scan_token alias for $2;
  v_current_user_id uuid;
  v_scan_state_row public.model_review_scan_states%rowtype;
  v_updated_scan_state_row public.model_review_scan_states%rowtype;
  v_scan_row public.ai_scan_runs%rowtype;
  v_review_event_row public.review_history_events%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authenticated user required' using errcode = '28000';
  end if;

  v_current_user_id := public.app_current_demo_user_id();

  if v_current_user_id is null then
    raise exception 'Authenticated demo user profile not found' using errcode = '28000';
  end if;

  if not public.app_is_project_member(p_project_id) then
    raise exception 'Project membership required' using errcode = '42501';
  end if;

  select scan_states.*
  into v_scan_state_row
  from public.model_review_scan_states as scan_states
  where scan_states.project_id = p_project_id
  for update;

  if not found then
    raise exception 'Model Review scan state not found for project: %', p_project_id using errcode = 'P0002';
  end if;

  if v_scan_state_row.pending_scan_token is null
    or v_scan_state_row.pending_scan_token <> p_scan_token then
    raise exception 'Model Review scan completion token is stale or cancelled' using errcode = '40001';
  end if;

  select scan_runs.*
  into v_scan_row
  from public.ai_scan_runs as scan_runs
  where scan_runs.project_id = p_project_id
    and scan_runs.status = 'completed'
    and scan_runs.source in ('seed', 'mock')
    and exists (
      select 1
      from public.ai_findings as findings
      where findings.project_id = scan_runs.project_id
        and findings.scan_run_id = scan_runs.id
    )
  order by scan_runs.completed_at desc nulls last, scan_runs.created_at desc
  limit 1;

  if not found then
    raise exception 'Completed seeded Model Review scan run not found for project: %', p_project_id using errcode = 'P0002';
  end if;

  update public.model_review_scan_states as scan_states
  set status = 'scanned_with_findings',
      pending_scan_token = null,
      updated_by_user_id = v_current_user_id,
      last_completed_at = now()
  where scan_states.project_id = v_scan_state_row.project_id
  returning scan_states.* into v_updated_scan_state_row;

  insert into public.review_history_events as review_events (
    project_id,
    event_type,
    actor_user_id,
    scan_run_id,
    label,
    detail
  )
  values (
    v_scan_row.project_id,
    'scan_completed',
    v_current_user_id,
    v_scan_row.id,
    'AI scan completed',
    v_scan_row.finding_count::text || ' coordination findings available'
  )
  returning review_events.* into v_review_event_row;

  return jsonb_build_object(
    'scan_state', to_jsonb(v_updated_scan_state_row),
    'review_history_event', to_jsonb(v_review_event_row)
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
#variable_conflict error
declare
  p_project_id alias for $1;
  v_current_user_id uuid;
  v_scan_state_row public.model_review_scan_states%rowtype;
  v_updated_scan_state_row public.model_review_scan_states%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authenticated user required' using errcode = '28000';
  end if;

  v_current_user_id := public.app_current_demo_user_id();

  if v_current_user_id is null then
    raise exception 'Authenticated demo user profile not found' using errcode = '28000';
  end if;

  if not public.app_is_project_member(p_project_id) then
    raise exception 'Project membership required' using errcode = '42501';
  end if;

  select scan_states.*
  into v_scan_state_row
  from public.model_review_scan_states as scan_states
  where scan_states.project_id = p_project_id
  for update;

  if found then
    update public.model_review_scan_states as scan_states
    set status = 'not_scanned',
        pending_scan_token = null,
        updated_by_user_id = v_current_user_id
    where scan_states.project_id = v_scan_state_row.project_id
    returning scan_states.* into v_updated_scan_state_row;
  else
    insert into public.model_review_scan_states as scan_states (
      project_id,
      status,
      pending_scan_token,
      updated_by_user_id
    )
    values (
      p_project_id,
      'not_scanned',
      null,
      v_current_user_id
    )
    returning scan_states.* into v_updated_scan_state_row;
  end if;

  return jsonb_build_object(
    'scan_state', to_jsonb(v_updated_scan_state_row),
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
