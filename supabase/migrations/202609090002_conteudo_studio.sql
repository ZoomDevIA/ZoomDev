-- Conteúdo pesado do Studio: documento, trilha, texto extraído de anexos e MVP.
-- Arquivos originais de anexos não são persistidos por política de privacidade.
create table if not exists public.zoomdev_project_content (
  project_id text primary key references public.zoomdev_projects(id) on delete cascade,
  dados jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);
alter table public.zoomdev_project_content enable row level security;