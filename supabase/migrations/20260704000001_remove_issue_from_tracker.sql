alter table public.model_review_issues
add column removed_from_tracker_at timestamptz,
add column removed_from_tracker_by_user_id uuid references public.demo_users(id);

drop index if exists public.model_review_issues_one_active_per_finding_idx;

create unique index model_review_issues_one_active_per_finding_idx
  on public.model_review_issues(source_finding_id)
  where removed_from_tracker_at is null
    and status <> 'Closed as not actionable';

create or replace function public.create_issue_from_finding(
  finding_id uuid,
  idempotency_key uuid,
  display_overrides jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  current_user_id uuid;
  finding_row public.ai_findings%rowtype;
  updated_finding_row public.ai_findings%rowtype;
  scan_row public.ai_scan_runs%rowtype;
  issue_row public.model_review_issues%rowtype;
  decision_row public.ai_finding_decisions%rowtype;
  status_history_row public.issue_status_history%rowtype;
  review_event_row public.review_history_events%rowtype;
  prior_issue_row public.model_review_issues%rowtype;
  issue_title text;
  issue_priority text;
  related_object text;
  related_level text;
begin
  current_user_id := public.app_current_demo_user_id();

  if current_user_id is null then
    raise exception 'Authenticated demo user profile not found' using errcode = '28000';
  end if;

  if $2 is not null then
    select d.*
    into decision_row
    from public.ai_finding_decisions d
    where d.idempotency_key = $2;

    if found then
      if decision_row.finding_id <> $1
        or decision_row.decision_type <> 'create_issue'
        or decision_row.created_issue_id is null then
        raise exception 'Idempotency key was already used for another finding decision' using errcode = '23505';
      end if;

      select i.*
      into issue_row
      from public.model_review_issues i
      where i.id = decision_row.created_issue_id;

      if issue_row.id is null then
        raise exception 'Idempotent issue result is incomplete' using errcode = '23503';
      end if;

      if not public.app_is_project_member(issue_row.project_id) then
        raise exception 'Project membership required' using errcode = '42501';
      end if;

      select sh.*
      into status_history_row
      from public.issue_status_history sh
      where sh.issue_id = issue_row.id
        and sh.to_status = 'Open'
      order by sh.changed_at asc
      limit 1;

      select rhe.*
      into review_event_row
      from public.review_history_events rhe
      where rhe.decision_id = decision_row.id
      order by rhe.created_at desc
      limit 1;

      select af.*
      into updated_finding_row
      from public.ai_findings af
      where af.id = issue_row.source_finding_id;

      return jsonb_build_object(
        'issue', to_jsonb(issue_row),
        'decision', to_jsonb(decision_row),
        'status_history', to_jsonb(status_history_row),
        'review_history_event', to_jsonb(review_event_row),
        'finding_status', updated_finding_row.current_status
      );
    end if;
  end if;

  select af.*
  into finding_row
  from public.ai_findings af
  where af.id = $1
  for update;

  if not found then
    raise exception 'AI finding not found: %', $1 using errcode = 'P0002';
  end if;

  if not public.app_is_project_member(finding_row.project_id) then
    raise exception 'Project membership required' using errcode = '42501';
  end if;

  select sr.*
  into scan_row
  from public.ai_scan_runs sr
  where sr.id = finding_row.scan_run_id
    and sr.project_id = finding_row.project_id;

  if not found then
    raise exception 'Finding scan lineage is invalid' using errcode = '23503';
  end if;

  select i.*
  into prior_issue_row
  from public.model_review_issues i
  where i.source_finding_id = finding_row.id
    and i.removed_from_tracker_at is null
    and i.status <> 'Closed as not actionable'
  limit 1;

  if found then
    raise exception 'Finding already has an active issue: %', prior_issue_row.id using errcode = '23505';
  end if;

  issue_title := coalesce(nullif(trim($3 ->> 'title'), ''), finding_row.title);
  issue_priority := coalesce(nullif(trim($3 ->> 'priority'), ''), finding_row.suggested_priority);
  related_object := coalesce(nullif(trim($3 ->> 'related_object'), ''), finding_row.object_label);
  related_level := coalesce(nullif(trim($3 ->> 'related_level'), ''), finding_row.level);

  if issue_priority not in ('critical', 'warning', 'info') then
    raise exception 'Unsupported issue priority: %', issue_priority using errcode = '22023';
  end if;

  insert into public.model_review_issues (
    issue_code,
    project_id,
    created_by_user_id,
    source_finding_id,
    source_scan_run_id,
    source_finding_code,
    title,
    related_object,
    related_level,
    priority,
    status
  )
  values (
    public.app_next_issue_code(finding_row.project_id),
    finding_row.project_id,
    current_user_id,
    finding_row.id,
    finding_row.scan_run_id,
    finding_row.code,
    issue_title,
    related_object,
    related_level,
    issue_priority,
    'Open'
  )
  returning * into issue_row;

  insert into public.ai_finding_decisions (
    project_id,
    finding_id,
    scan_run_id,
    user_id,
    decision_type,
    created_issue_id,
    idempotency_key
  )
  values (
    finding_row.project_id,
    finding_row.id,
    finding_row.scan_run_id,
    current_user_id,
    'create_issue',
    issue_row.id,
    $2
  )
  returning * into decision_row;

  insert into public.issue_status_history (
    project_id,
    issue_id,
    from_status,
    to_status,
    changed_by_user_id,
    change_reason
  )
  values (
    finding_row.project_id,
    issue_row.id,
    null,
    'Open',
    current_user_id,
    'Issue created from AI finding'
  )
  returning * into status_history_row;

  insert into public.review_history_events (
    project_id,
    event_type,
    actor_user_id,
    scan_run_id,
    finding_id,
    issue_id,
    decision_id,
    status_history_id,
    label,
    detail
  )
  values (
    finding_row.project_id,
    'issue_created',
    current_user_id,
    finding_row.scan_run_id,
    finding_row.id,
    issue_row.id,
    decision_row.id,
    status_history_row.id,
    'Issue created',
    issue_row.issue_code || ' created from ' || finding_row.code
  )
  returning * into review_event_row;

  update public.ai_findings
  set current_status = 'issue-created'
  where id = finding_row.id
  returning * into updated_finding_row;

  return jsonb_build_object(
    'issue', to_jsonb(issue_row),
    'decision', to_jsonb(decision_row),
    'status_history', to_jsonb(status_history_row),
    'review_history_event', to_jsonb(review_event_row),
    'finding_status', updated_finding_row.current_status
  );
end;
$$;

create or replace function public.remove_issue_from_tracker(
  issue_id uuid,
  idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  current_user_id uuid;
  issue_row public.model_review_issues%rowtype;
  updated_issue_row public.model_review_issues%rowtype;
  finding_row public.ai_findings%rowtype;
  updated_finding_row public.ai_findings%rowtype;
  decision_row public.ai_finding_decisions%rowtype;
  review_event_row public.review_history_events%rowtype;
begin
  current_user_id := public.app_current_demo_user_id();

  if current_user_id is null then
    raise exception 'Authenticated demo user profile not found' using errcode = '28000';
  end if;

  if $2 is not null then
    select d.*
    into decision_row
    from public.ai_finding_decisions d
    where d.idempotency_key = $2;

    if found then
      if decision_row.decision_type <> 'remove_issue_link'
        or decision_row.created_issue_id is null
        or decision_row.created_issue_id <> $1 then
        raise exception 'Idempotency key was already used for another finding decision' using errcode = '23505';
      end if;

      select i.*
      into updated_issue_row
      from public.model_review_issues i
      where i.id = decision_row.created_issue_id;

      if updated_issue_row.id is null then
        raise exception 'Idempotent issue removal result is incomplete' using errcode = '23503';
      end if;

      if updated_issue_row.removed_from_tracker_at is null then
        raise exception 'Idempotent issue removal is not committed: %', updated_issue_row.id using errcode = '23503';
      end if;

      if not public.app_is_project_member(updated_issue_row.project_id) then
        raise exception 'Project membership required' using errcode = '42501';
      end if;

      select af.*
      into updated_finding_row
      from public.ai_findings af
      where af.id = decision_row.finding_id;

      if not found then
        raise exception 'Idempotent issue removal source finding is incomplete' using errcode = '23503';
      end if;

      select rhe.*
      into review_event_row
      from public.review_history_events rhe
      where rhe.decision_id = decision_row.id
        and rhe.issue_id = updated_issue_row.id
        and rhe.event_type = 'issue_link_removed'
      order by rhe.created_at desc
      limit 1;

      if not found then
        raise exception 'Idempotent issue removal history is incomplete' using errcode = '23503';
      end if;

      return jsonb_build_object(
        'issue', to_jsonb(updated_issue_row),
        'decision', to_jsonb(decision_row),
        'review_history_event', to_jsonb(review_event_row),
        'finding_status', updated_finding_row.current_status
      );
    end if;
  end if;

  select i.*
  into issue_row
  from public.model_review_issues i
  where i.id = $1
  for update;

  if not found then
    raise exception 'Model Review issue not found: %', $1 using errcode = 'P0002';
  end if;

  if not public.app_is_project_member(issue_row.project_id) then
    raise exception 'Project membership required' using errcode = '42501';
  end if;

  select af.*
  into finding_row
  from public.ai_findings af
  where af.id = issue_row.source_finding_id
    and af.project_id = issue_row.project_id
  for update;

  if not found then
    raise exception 'Issue source finding lineage is invalid' using errcode = '23503';
  end if;

  if issue_row.removed_from_tracker_at is not null then
    select d.*
    into decision_row
    from public.ai_finding_decisions d
    where d.created_issue_id = issue_row.id
      and d.finding_id = finding_row.id
      and d.decision_type = 'remove_issue_link'
    order by d.created_at asc
    limit 1;

    if not found then
      raise exception 'Removed issue is missing its removal decision: %', issue_row.id using errcode = '23503';
    end if;

    select rhe.*
    into review_event_row
    from public.review_history_events rhe
    where rhe.decision_id = decision_row.id
      and rhe.issue_id = issue_row.id
      and rhe.event_type = 'issue_link_removed'
    order by rhe.created_at asc
    limit 1;

    if not found then
      raise exception 'Removed issue is missing its removal history event: %', issue_row.id using errcode = '23503';
    end if;

    return jsonb_build_object(
      'issue', to_jsonb(issue_row),
      'decision', to_jsonb(decision_row),
      'review_history_event', to_jsonb(review_event_row),
      'finding_status', finding_row.current_status
    );
  end if;

  update public.model_review_issues
  set removed_from_tracker_at = now(),
      removed_from_tracker_by_user_id = current_user_id
  where id = issue_row.id
  returning * into updated_issue_row;

  insert into public.ai_finding_decisions (
    project_id,
    finding_id,
    scan_run_id,
    user_id,
    decision_type,
    created_issue_id,
    idempotency_key
  )
  values (
    issue_row.project_id,
    finding_row.id,
    finding_row.scan_run_id,
    current_user_id,
    'remove_issue_link',
    issue_row.id,
    $2
  )
  returning * into decision_row;

  update public.ai_findings
  set current_status = 'active'
  where id = finding_row.id
  returning * into updated_finding_row;

  insert into public.review_history_events (
    project_id,
    event_type,
    actor_user_id,
    scan_run_id,
    finding_id,
    issue_id,
    decision_id,
    label,
    detail
  )
  values (
    issue_row.project_id,
    'issue_link_removed',
    current_user_id,
    finding_row.scan_run_id,
    finding_row.id,
    issue_row.id,
    decision_row.id,
    'Issue removed',
    issue_row.issue_code || ' removed from ' || finding_row.code
  )
  returning * into review_event_row;

  return jsonb_build_object(
    'issue', to_jsonb(updated_issue_row),
    'decision', to_jsonb(decision_row),
    'review_history_event', to_jsonb(review_event_row),
    'finding_status', updated_finding_row.current_status
  );
end;
$$;

revoke all on function public.remove_issue_from_tracker(uuid, uuid) from public, anon;

grant execute on function public.remove_issue_from_tracker(uuid, uuid) to authenticated, service_role;
