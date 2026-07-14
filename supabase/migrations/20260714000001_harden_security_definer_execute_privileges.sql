do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated, service_role';
  end if;
end;
$$;

revoke execute on function public.app_current_demo_user_id() from service_role;
revoke execute on function public.app_is_project_member(text) from service_role;
revoke execute on function public.app_next_issue_code(text) from service_role;
revoke execute on function public.create_issue_from_finding(uuid, uuid, jsonb) from service_role;
revoke execute on function public.record_finding_decision(uuid, text, uuid, text) from service_role;
revoke execute on function public.update_issue_status(uuid, text, uuid, text) from service_role;
revoke execute on function public.remove_issue_from_tracker(uuid, uuid) from service_role;
