-- Handoff Hub: private per-user isolation
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  key_hash text not null unique,
  created_at timestamptz not null default now()
);

alter table public.handoff_state add column if not exists user_id uuid references public.users(id);

-- The old row was a mixed public bucket. Remove it rather than assigning another user's data to the new account.
delete from public.handoff_state where user_id is null;

alter table public.handoff_state alter column user_id set not null;
create unique index if not exists handoff_state_user_id_key on public.handoff_state (user_id);

alter table public.users enable row level security;
alter table public.handoff_state enable row level security;
