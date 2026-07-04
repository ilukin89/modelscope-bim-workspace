update public.ai_findings
set current_status = 'active'
where current_status = 'follow-up';

alter table public.ai_findings
drop constraint if exists ai_findings_current_status_check;

alter table public.ai_findings
add constraint ai_findings_current_status_check
check (current_status in ('active', 'issue-created', 'dismissed'));

alter table public.ai_finding_decisions
drop constraint if exists ai_finding_decisions_decision_type_check;

alter table public.ai_finding_decisions
add constraint ai_finding_decisions_decision_type_check
check (decision_type in ('create_issue', 'dismiss', 'restore', 'remove_issue_link'));
