create or replace function public.portal_project_delete(
  p_token text,
  p_hub_user uuid,
  p_project text,
  p_confirm_name text
)
returns jsonb language plpgsql security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_account uuid;
  v_project text := nullif(btrim(coalesce(p_project, '')), '');
  v_expected_name text;
  v_count int;
begin
  select s.account_id into v_account from public.portal_sessions s
  where s.token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex')
    and s.expires_at > now();
  if v_account is null then return jsonb_build_object('ok', false, 'error', 'Not signed in.'); end if;
  if not exists (select 1 from public.portal_hub_links where account_id = v_account and hub_user_id = p_hub_user) then
    return jsonb_build_object('ok', false, 'error', 'Account not found.');
  end if;
  if v_project is null or char_length(v_project) > 60 then
    return jsonb_build_object('ok', false, 'error', 'Invalid project pool.');
  end if;
  select coalesce(nullif(h.state->'archived_projects'->v_project->>'name', ''), v_project)
    into v_expected_name
  from public.handoff_state h
  where h.user_id = p_hub_user and coalesce(h.state->'archived_projects', '{}'::jsonb) ? v_project;
  if v_expected_name is null then return jsonb_build_object('ok', false, 'error', 'Archived pool not found.'); end if;
  if p_confirm_name is distinct from v_expected_name then
    return jsonb_build_object('ok', false, 'error', 'The project name did not match. Nothing was deleted.');
  end if;
  update public.handoff_state h
  set state = jsonb_set(h.state, '{archived_projects}', coalesce(h.state->'archived_projects', '{}'::jsonb) - v_project, true),
      version = h.version + 1, updated_at = now()
  where h.user_id = p_hub_user and coalesce(h.state->'archived_projects', '{}'::jsonb) ? v_project;
  get diagnostics v_count = row_count;
  if v_count = 0 then return jsonb_build_object('ok', false, 'error', 'Archived pool not found.'); end if;
  return jsonb_build_object('ok', true, 'deleted', v_project);
end
$function$;
revoke all on function public.portal_project_delete(text, uuid, text, text) from public;
grant execute on function public.portal_project_delete(text, uuid, text, text) to anon, authenticated;
