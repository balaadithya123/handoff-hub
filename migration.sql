-- Handoff Hub: private per-user isolation
create table if not exists public.users (id uuid primary key default gen_random_uuid(),key_hash text not null unique,created_at timestamptz not null default now());
alter table public.handoff_state add column if not exists user_id uuid references public.users(id);
delete from public.handoff_state where user_id is null;
alter table public.handoff_state alter column user_id set not null;
create unique index if not exists handoff_state_user_id_key on public.handoff_state(user_id);
alter table public.users enable row level security;
alter table public.handoff_state enable row level security;
create table if not exists public.provider_connections (account_id uuid not null references public.portal_accounts(id) on delete cascade,provider text not null check(provider in ('github','canva','vercel')),access_token text not null,refresh_token text,expires_at timestamptz,provider_account_id text,provider_account_name text,scope text,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),primary key(account_id,provider));
alter table public.provider_connections enable row level security;
create table if not exists public.provider_oauth_flows (state_hash text primary key,ticket_hash text unique,account_id uuid not null references public.portal_accounts(id) on delete cascade,provider text not null check(provider in ('github','canva','vercel')),code_verifier text not null,expires_at timestamptz not null,completed_at timestamptz,consumed_at timestamptz,created_at timestamptz not null default now());
alter table public.provider_oauth_flows enable row level security;
