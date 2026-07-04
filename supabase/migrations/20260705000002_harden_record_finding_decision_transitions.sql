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

  if $2 = 'create_issue' then
    raise exception 'Use create_issue_from_finding for create_issue decisions' using errcode = '0A000';
  end if;

  if $2 = 'remove_issue_link' then
    raise exception 'Use remove_issue_from_tracker for remove_issue_link decisions' using errcode = '0A000';
  end if;

  if $2 not in ('dismiss', 'restore') then
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

  if $2 = 'dismiss' and finding_row.current_status <> 'active' then
    raise exception 'Cannot dismiss finding with status: %', finding_row.current_status using errcode = '22023';
  end if;

  if $2 = 'restore' and finding_row.current_status <> 'dismissed' then
    raise exception 'Cannot restore finding with status: %', finding_row.current_status using errcode = '22023';
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
