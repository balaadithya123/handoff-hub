create or replace function public.portal_project_archive(p_token text, p_hub_user uuid, p_project text)
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions'
as $function$
declare
  v_account uuid;
  v_project text := nullif(btrim(coalesce(p_project, '')), '');
  v_active text;
  v_count int;
  v_now text := to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
begin
  select s.account_id into v_account from public.portal_sessions s
  where s.token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex') and s.expires_at > now();
  if v_account is null then return jsonb_build_object('ok', false, 'error', 'Not signed in.'); end if;
  if not exists (select 1 from public.portal_hub_links where account_id = v_account and hub_user_id = p_hub_user) then
    return jsonb_build_object('ok', false, 'error', 'Account not found.');
  end if;
  if v_project is null or v_project = 'default' or char_length(v_project) > 60 then
    return jsonb_build_object('ok', false, 'error', 'This pool cannot be archived.');
  end if;
  select coalesce(h.state->'meta'->>'ops_project', 'default') into v_active
  from public.handoff_state h where h.user_id = p_hub_user;
  if not exists (select 1 from public.handoff_state h where h.user_id = p_hub_user and coalesce(h.state->'projects', '{}'::jsonb) ? v_project) then
    return jsonb_build_object('ok', false, 'error', 'Project pool not found.');
  end if;
  if v_active = v_project then
    return jsonb_build_object('ok', false, 'error', 'Select a different portal feed before archiving this pool.');
  end if;
  update public.handoff_state h
  set state = jsonb_set(
    jsonb_set(h.state, '{archived_projects}', coalesce(h.state->'archived_projects', '{}'::jsonb)
      || jsonb_build_object(v_project, (h.state->'projects'->v_project) || jsonb_build_object('archived_at', v_now)), true),
    '{projects}', coalesce(h.state->'projects', '{}'::jsonb) - v_project, true
  ), version = h.version + 1, updated_at = now()
  where h.user_id = p_hub_user;
  get diagnostics v_count = row_count;
  if v_count = 0 then return jsonb_build_object('ok', false, 'error', 'No Hub data for this account yet.'); end if;
  return jsonb_build_object('ok', true, 'archived', v_project);
end $function$;

create or replace function public.portal_project_restore(p_token text, p_hub_user uuid, p_project text)
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions'
as $function$
declare
  v_account uuid;
  v_project text := nullif(btrim(coalesce(p_project, '')), '');
  v_count int;
begin
  select s.account_id into v_account from public.portal_sessions s
  where s.token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex') and s.expires_at > now();
  if v_account is null then return jsonb_build_object('ok', false, 'error', 'Not signed in.'); end if;
  if not exists (select 1 from public.portal_hub_links where account_id = v_account and hub_user_id = p_hub_user) then
    return jsonb_build_object('ok', false, 'error', 'Account not found.');
  end if;
  if v_project is null or char_length(v_project) > 60 then
    return jsonb_build_object('ok', false, 'error', 'Invalid project pool.');
  end if;
  if not exists (select 1 from public.handoff_state h where h.user_id = p_hub_user and coalesce(h.state->'archived_projects', '{}'::jsonb) ? v_project) then
    return jsonb_build_object('ok', false, 'error', 'Archived pool not found.');
  end if;
  if coalesce((select h.state->'projects' ? v_project from public.handoff_state h where h.user_id = p_hub_user), false) then
    return jsonb_build_object('ok', false, 'error', 'A pool with this ID already exists.');
  end if;
  update public.handoff_state h
  set state = jsonb_set(
    jsonb_set(h.state, '{projects}', coalesce(h.state->'projects', '{}'::jsonb)
      || jsonb_build_object(v_project, (h.state->'archived_projects'->v_project) - 'archived_at'), true),
    '{archived_projects}', coalesce(h.state->'archived_projects', '{}'::jsonb) - v_project, true
  ), version = h.version + 1, updated_at = now()
  where h.user_id = p_hub_user;
  get diagnostics v_count = row_count;
  if v_count = 0 then return jsonb_build_object('ok', false, 'error', 'No Hub data for this account yet.'); end if;
  return jsonb_build_object('ok', true, 'restored', v_project);
end $function$;

create or replace function public.portal_archived_projects(p_token text)
returns jsonb language plpgsql stable security definer set search_path to 'public', 'extensions'
as $function$
declare
  v_account uuid;
  v_result jsonb;
begin
  select s.account_id into v_account from public.portal_sessions s
  where s.token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex') and s.expires_at > now();
  if v_account is null then return jsonb_build_object('ok', false, 'accounts', '[]'::jsonb); end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', l.hub_user_id, 'label', coalesce(u.email, 'AI account'), 'nickname', l.nickname,
    'projects', coalesce((
      select jsonb_agg(jsonb_build_object('id', pr.key, 'name', coalesce(nullif(pr.value->>'name', ''), pr.key),
        'description', pr.value->>'description', 'archived_at', pr.value->>'archived_at') order by pr.key)
      from jsonb_each(coalesce(h.state->'archived_projects', '{}'::jsonb)) pr
    ), '[]'::jsonb)
  ) order by l.created_at), '[]'::jsonb)
  into v_result
  from public.portal_hub_links l
  left join public.users u on u.id = l.hub_user_id
  left join public.handoff_state h on h.user_id = l.hub_user_id
  where l.account_id = v_account;
  return jsonb_build_object('ok', true, 'accounts', v_result);
end $function$;

revoke all on function public.portal_project_archive(text, uuid, text) from public;
revoke all on function public.portal_project_restore(text, uuid, text) from public;
revoke all on function public.portal_archived_projects(text) from public;
grant execute on function public.portal_project_archive(text, uuid, text) to anon, authenticated;
grant execute on function public.portal_project_restore(text, uuid, text) to anon, authenticated;
grant execute on function public.portal_archived_projects(text) to anon, authenticated;
