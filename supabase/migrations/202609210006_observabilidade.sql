-- Observabilidade: trilha administrativa e incidentes técnicos gerados pela
-- API. Não há políticas de leitura direta: só o backend, via service_role,
-- acessa esses registros após validar a sessão administrativa.

create table if not exists public.zoomdev_audit_logs (
  id text primary key,
  ocorrido_em timestamptz not null,
  ator_id text,
  ator_nome text not null default 'sistema',
  ator_email text,
  acao text not null,
  alvo text,
  detalhe text,
  ip text
);

create index if not exists zoomdev_audit_logs_ocorrido_idx
  on public.zoomdev_audit_logs (ocorrido_em desc);
create index if not exists zoomdev_audit_logs_ator_idx
  on public.zoomdev_audit_logs (ator_id, ocorrido_em desc)
  where ator_id is not null;

create table if not exists public.zoomdev_operation_incidents (
  id text primary key,
  referencia text,
  ocorrido_em timestamptz not null,
  http_status integer not null,
  codigo text not null,
  metodo text not null,
  rota text not null,
  mensagem text not null
);

create index if not exists zoomdev_operation_incidents_ocorrido_idx
  on public.zoomdev_operation_incidents (ocorrido_em desc);
create index if not exists zoomdev_operation_incidents_referencia_idx
  on public.zoomdev_operation_incidents (referencia)
  where referencia is not null;

alter table public.zoomdev_audit_logs enable row level security;
alter table public.zoomdev_operation_incidents enable row level security;

-- Nenhuma policy: anon/authenticated não pode ler nem escrever diretamente.
