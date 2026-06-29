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

create or replace function public.record_finding_decision(
  finding_id uuid,
  decision_type text,
  idempotency_key uuid default null,
  note text default null
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
  decision_row public.ai_finding_decisions%rowtype;
  review_event_row public.review_history_events%rowtype;
  next_status text;
  event_type text;
  event_label text;
  event_detail text;
begin
  current_user_id := public.app_current_demo_user_id();

  if current_user_id is null then
    raise exception 'Authenticated demo user profile not found' using errcode = '28000';
  end if;

  if $2 = 'mark_follow_up' then
    raise exception 'mark_follow_up is reserved for a future workflow' using errcode = '0A000';
  end if;

  if $2 = 'create_issue' then
    raise exception 'Use create_issue_from_finding for create_issue decisions' using errcode = '0A000';
  end if;

  if $2 not in ('dismiss', 'restore', 'remove_issue_link') then
    raise exception 'Unsupported finding decision type: %', $2 using errcode = '22023';
  end if;

  if $3 is not null then
    select d.*
    into decision_row
    from public.ai_finding_decisions d
    where d.idempotency_key = $3;

    if found then
      if decision_row.finding_id <> $1
        or decision_row.decision_type <> $2 then
        raise exception 'Idempotency key was already used for another finding decision' using errcode = '23505';
      end if;

      if not public.app_is_project_member(decision_row.project_id) then
        raise exception 'Project membership required' using errcode = '42501';
      end if;

      select rhe.*
      into review_event_row
      from public.review_history_events rhe
      where rhe.decision_id = decision_row.id
      order by rhe.created_at desc
      limit 1;

      select af.*
      into updated_finding_row
      from public.ai_findings af
      where af.id = decision_row.finding_id;

      return jsonb_build_object(
        'decision', to_jsonb(decision_row),
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

  case $2
    when 'dismiss' then
      next_status := 'dismissed';
      event_type := 'finding_dismissed';
      event_label := 'Finding dismissed';
      event_detail := finding_row.code || ' dismissed';
    when 'restore' then
      next_status := 'active';
      event_type := 'finding_restored';
      event_label := 'Finding restored';
      event_detail := finding_row.code || ' restored';
    when 'remove_issue_link' then
      next_status := 'active';
      event_type := 'issue_link_removed';
      event_label := 'Issue link removed';
      event_detail := 'Issue link removed from ' || finding_row.code;
  end case;

  insert into public.ai_finding_decisions (
    project_id,
    finding_id,
    scan_run_id,
    user_id,
    decision_type,
    decision_note,
    idempotency_key
  )
  values (
    finding_row.project_id,
    finding_row.id,
    finding_row.scan_run_id,
    current_user_id,
    $2,
    $4,
    $3
  )
  returning * into decision_row;

  update public.ai_findings
  set current_status = next_status
  where id = finding_row.id
  returning * into updated_finding_row;

  insert into public.review_history_events (
    project_id,
    event_type,
    actor_user_id,
    scan_run_id,
    finding_id,
    decision_id,
    label,
    detail
  )
  values (
    finding_row.project_id,
    event_type,
    current_user_id,
    finding_row.scan_run_id,
    finding_row.id,
    decision_row.id,
    event_label,
    event_detail
  )
  returning * into review_event_row;

  return jsonb_build_object(
    'decision', to_jsonb(decision_row),
    'review_history_event', to_jsonb(review_event_row),
    'finding_status', updated_finding_row.current_status
  );
end;
$$;

create or replace function public.update_issue_status(
  issue_id uuid,
  to_status text,
  idempotency_key uuid default null,
  reason text default null
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
  status_history_row public.issue_status_history%rowtype;
  review_event_row public.review_history_events%rowtype;
begin
  current_user_id := public.app_current_demo_user_id();

  if current_user_id is null then
    raise exception 'Authenticated demo user profile not found' using errcode = '28000';
  end if;

  if $2 not in ('Open', 'In Review', 'Resolved', 'Blocked', 'Closed as not actionable') then
    raise exception 'Unsupported issue status: %', $2 using errcode = '22023';
  end if;

  if $3 is not null then
    select sh.*
    into status_history_row
    from public.issue_status_history sh
    where sh.idempotency_key = $3;

    if found then
      if status_history_row.issue_id <> $1
        or status_history_row.to_status <> $2 then
        raise exception 'Idempotency key was already used for another status transition' using errcode = '23505';
      end if;

      select i.*
      into updated_issue_row
      from public.model_review_issues i
      where i.id = status_history_row.issue_id;

      if not public.app_is_project_member(updated_issue_row.project_id) then
        raise exception 'Project membership required' using errcode = '42501';
      end if;

      select rhe.*
      into review_event_row
      from public.review_history_events rhe
      where rhe.status_history_id = status_history_row.id
      order by rhe.created_at desc
      limit 1;

      return jsonb_build_object(
        'issue', to_jsonb(updated_issue_row),
        'status_history', to_jsonb(status_history_row),
        'review_history_event', to_jsonb(review_event_row)
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

  if issue_row.status = $2 then
    raise exception 'Issue already has status: %', $2 using errcode = '22023';
  end if;

  update public.model_review_issues
  set status = $2
  where id = issue_row.id
  returning * into updated_issue_row;

  insert into public.issue_status_history (
    project_id,
    issue_id,
    from_status,
    to_status,
    changed_by_user_id,
    change_reason,
    idempotency_key
  )
  values (
    issue_row.project_id,
    issue_row.id,
    issue_row.status,
    $2,
    current_user_id,
    $4,
    $3
  )
  returning * into status_history_row;

  insert into public.review_history_events (
    project_id,
    event_type,
    actor_user_id,
    scan_run_id,
    finding_id,
    issue_id,
    status_history_id,
    label,
    detail
  )
  values (
    issue_row.project_id,
    'issue_status_changed',
    current_user_id,
    issue_row.source_scan_run_id,
    issue_row.source_finding_id,
    issue_row.id,
    status_history_row.id,
    'Issue status changed',
    issue_row.issue_code || ' moved from ' || issue_row.status || ' to ' || $2
  )
  returning * into review_event_row;

  return jsonb_build_object(
    'issue', to_jsonb(updated_issue_row),
    'status_history', to_jsonb(status_history_row),
    'review_history_event', to_jsonb(review_event_row)
  );
end;
$$;

revoke all on function public.create_issue_from_finding(uuid, uuid, jsonb) from public, anon;
revoke all on function public.record_finding_decision(uuid, text, uuid, text) from public, anon;
revoke all on function public.update_issue_status(uuid, text, uuid, text) from public, anon;

grant execute on function public.create_issue_from_finding(uuid, uuid, jsonb) to authenticated, service_role;
grant execute on function public.record_finding_decision(uuid, text, uuid, text) to authenticated, service_role;
grant execute on function public.update_issue_status(uuid, text, uuid, text) to authenticated, service_role;
