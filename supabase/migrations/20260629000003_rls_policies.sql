revoke all privileges on table public.demo_users from public, anon, authenticated;
revoke all privileges on table public.projects from public, anon, authenticated;
revoke all privileges on table public.project_memberships from public, anon, authenticated;
revoke all privileges on table public.ai_scan_runs from public, anon, authenticated;
revoke all privileges on table public.ai_findings from public, anon, authenticated;
revoke all privileges on table public.ai_finding_decisions from public, anon, authenticated;
revoke all privileges on table public.model_review_issues from public, anon, authenticated;
revoke all privileges on table public.issue_status_history from public, anon, authenticated;
revoke all privileges on table public.review_history_events from public, anon, authenticated;

grant select on table public.demo_users to authenticated;
grant select on table public.projects to authenticated;
grant select on table public.project_memberships to authenticated;
grant select on table public.ai_scan_runs to authenticated;
grant select on table public.ai_findings to authenticated;
grant select on table public.ai_finding_decisions to authenticated;
grant select on table public.model_review_issues to authenticated;
grant select on table public.issue_status_history to authenticated;
grant select on table public.review_history_events to authenticated;

grant select, insert, update on table public.demo_users to service_role;
grant select, insert, update on table public.projects to service_role;
grant select, insert, update on table public.project_memberships to service_role;
grant select, insert, update on table public.ai_scan_runs to service_role;
grant select, insert, update on table public.ai_findings to service_role;
grant select, insert, update on table public.ai_finding_decisions to service_role;
grant select, insert, update on table public.model_review_issues to service_role;
grant select, insert, update on table public.issue_status_history to service_role;
grant select, insert, update on table public.review_history_events to service_role;

revoke all privileges on sequence public.model_review_issue_residential_tower_a_seq from public, anon, authenticated;
revoke all privileges on sequence public.model_review_issue_civic_center_east_seq from public, anon, authenticated;
revoke all privileges on sequence public.model_review_issue_transit_hub_02_seq from public, anon, authenticated;

grant usage, select, update on sequence public.model_review_issue_residential_tower_a_seq to service_role;
grant usage, select, update on sequence public.model_review_issue_civic_center_east_seq to service_role;
grant usage, select, update on sequence public.model_review_issue_transit_hub_02_seq to service_role;

grant execute on function public.app_current_demo_user_id() to authenticated, service_role;
grant execute on function public.app_is_project_member(text) to authenticated, service_role;
grant execute on function public.app_project_issue_prefix(text) to authenticated, service_role;
grant execute on function public.app_next_issue_code(text) to service_role;

create policy demo_users_select_own_profile
on public.demo_users
for select
to authenticated
using (auth_user_id = auth.uid());

create policy projects_select_member_projects
on public.projects
for select
to authenticated
using (public.app_is_project_member(id));

create policy project_memberships_select_own_rows
on public.project_memberships
for select
to authenticated
using (user_id = public.app_current_demo_user_id());

create policy ai_scan_runs_select_member_projects
on public.ai_scan_runs
for select
to authenticated
using (public.app_is_project_member(project_id));

create policy ai_findings_select_member_projects
on public.ai_findings
for select
to authenticated
using (public.app_is_project_member(project_id));

create policy ai_finding_decisions_select_member_projects
on public.ai_finding_decisions
for select
to authenticated
using (public.app_is_project_member(project_id));

create policy model_review_issues_select_member_projects
on public.model_review_issues
for select
to authenticated
using (public.app_is_project_member(project_id));

create policy issue_status_history_select_member_projects
on public.issue_status_history
for select
to authenticated
using (public.app_is_project_member(project_id));

create policy review_history_events_select_member_projects
on public.review_history_events
for select
to authenticated
using (public.app_is_project_member(project_id));
