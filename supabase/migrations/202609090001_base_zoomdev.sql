create table if not exists public.zoomdev_users (
  id text primary key,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  email text not null unique,
  nome text not null,
  papel text,
  ativo boolean not null default true,
  plano text not null default 'free',
  creditos integer not null default 0 check (creditos >= 0),
  gamification jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create table if not exists public.zoomdev_projects (
  id text primary key,
  user_id text not null references public.zoomdev_users(id) on delete cascade,
  nome text not null,
  descricao text not null,
  classificacao text,
  vertical text,
  fase text,
  publicado boolean not null default false,
  dados jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists zoomdev_projects_usuario_criado_idx on public.zoomdev_projects (user_id, criado_em desc);
create table if not exists public.zoomdev_state (
  chave text primary key,
  dados jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);
alter table public.zoomdev_users enable row level security;
alter table public.zoomdev_projects enable row level security;
alter table public.zoomdev_state enable row level security;