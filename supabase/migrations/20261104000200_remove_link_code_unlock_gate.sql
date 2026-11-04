-- Remove paid/unlock-code gating from additional AI account link codes.
-- A signed-in portal account can create its own short-lived, single-use code.
create or replace function public.portal_link_code(p_token text, p_unlock text default null)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  a uuid;
  c text;
begin
  select s.account_id into a
  from public.portal_sessions s
  where s.token_hash = encode(digest(coalesce(p_token,''),'sha256'),'hex')
    and s.expires_at > now();

  if a is null then
    return jsonb_build_object('ok',false,'error','Not signed in.');
  end if;

  delete from public.portal_link_codes
  where account_id = a or expires_at < now();

  c := upper(substr(encode(gen_random_bytes(8),'hex'),1,8));
  insert into public.portal_link_codes(code_hash,account_id,expires_at,unlocked)
  values (encode(digest(c,'sha256'),'hex'),a,now()+interval '10 minutes',true);

  return jsonb_build_object('ok',true,'code',c,'expires_in_minutes',10);
end
$function$;
