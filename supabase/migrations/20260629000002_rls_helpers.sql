create or replace function public.app_current_demo_user_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select du.id
  from public.demo_users du
  where du.auth_user_id = auth.uid()
  limit 1
$$;

revoke all on function public.app_current_demo_user_id() from public, anon;

create or replace function public.app_is_project_member(project_id text)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.project_memberships pm
    where pm.project_id = $1
      and pm.user_id = public.app_current_demo_user_id()
  )
$$;

revoke all on function public.app_is_project_member(text) from public, anon;

create or replace function public.app_project_issue_prefix(project_id text)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select case $1
    when 'residential-tower-a' then 'RES'
    when 'civic-center-east' then 'CIV'
    when 'transit-hub-02' then 'TH'
    else null
  end
$$;

revoke all on function public.app_project_issue_prefix(text) from public, anon;

create or replace function public.app_next_issue_code(project_id text)
returns text
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  next_number bigint;
  project_prefix text;
begin
  project_prefix := public.app_project_issue_prefix($1);

  if project_prefix is null then
    raise exception 'Unknown project id: %', $1 using errcode = '22023';
  end if;

  case $1
    when 'residential-tower-a' then
      next_number := nextval('public.model_review_issue_residential_tower_a_seq'::regclass);
    when 'civic-center-east' then
      next_number := nextval('public.model_review_issue_civic_center_east_seq'::regclass);
    when 'transit-hub-02' then
      next_number := nextval('public.model_review_issue_transit_hub_02_seq'::regclass);
    else
      raise exception 'Unknown project id: %', $1 using errcode = '22023';
  end case;

  return format('MRI-%s-%s', project_prefix, lpad(next_number::text, 4, '0'));
end;
$$;

revoke all on function public.app_next_issue_code(text) from public, anon, authenticated;
