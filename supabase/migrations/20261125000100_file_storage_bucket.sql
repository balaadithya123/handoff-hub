-- Private bucket for files shared between AIs. 30 MB per file; the 100 MB per-account total is
-- enforced by the server (src/files.js) from the account's file records. Access is only through the
-- server's service role (signed URLs), never public.
insert into storage.buckets (id, name, public, file_size_limit)
values ('axon-files', 'axon-files', false, 31457280)
on conflict (id) do update set public = false, file_size_limit = 31457280;
