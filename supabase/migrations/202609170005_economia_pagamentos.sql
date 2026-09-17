-- Economia financeira da ZoomDev: trilha de Seiva, compras, assinaturas e
-- deduplicacao dos webhooks do Stripe. O backend usa service_role; nenhuma
-- destas tabelas fica exposta diretamente ao navegador.

create table if not exists public.zoomdev_payment_transactions (
  id text primary key,
  user_id text not null references public.zoomdev_users(id) on delete cascade,
  tipo text not null,
  plano_id text,
  descricao text not null,
  valor numeric(12,2) not null default 0,
  moeda text not null default 'BRL',
  creditos integer not null default 0,
  status text not null,
  metodo text not null,
  stripe_session_id text unique,
  stripe_invoice_id text unique,
  stripe_subscription_id text,
  dados jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  pago_em timestamptz,
  cancelado_em timestamptz,
  atualizado_em timestamptz not null default now()
);

create index if not exists zoomdev_payment_transactions_user_criado_idx
  on public.zoomdev_payment_transactions (user_id, criado_em desc);
create index if not exists zoomdev_payment_transactions_subscription_idx
  on public.zoomdev_payment_transactions (stripe_subscription_id)
  where stripe_subscription_id is not null;

create table if not exists public.zoomdev_seiva_ledger (
  id text primary key,
  user_id text not null references public.zoomdev_users(id) on delete cascade,
  tipo text not null,
  quantidade integer not null check (quantidade <> 0),
  saldo_apos integer not null check (saldo_apos >= 0),
  descricao text not null,
  projeto_id text,
  transacao_id text references public.zoomdev_payment_transactions(id) on delete set null,
  origem text not null,
  dados jsonb not null default '{}'::jsonb,
  ocorrido_em timestamptz not null default now()
);

create index if not exists zoomdev_seiva_ledger_user_ocorrido_idx
  on public.zoomdev_seiva_ledger (user_id, ocorrido_em desc);
create index if not exists zoomdev_seiva_ledger_transacao_idx
  on public.zoomdev_seiva_ledger (transacao_id)
  where transacao_id is not null;

create table if not exists public.zoomdev_subscriptions (
  user_id text primary key references public.zoomdev_users(id) on delete cascade,
  plano_id text not null default 'free',
  status text not null default 'active',
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  cancelar_no_fim_do_periodo boolean not null default false,
  fim_do_periodo timestamptz,
  iniciada_em timestamptz,
  encerrada_em timestamptz,
  dados jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);

create table if not exists public.zoomdev_stripe_events (
  id text primary key,
  tipo text not null,
  recebido_em timestamptz not null default now()
);

alter table public.zoomdev_payment_transactions enable row level security;
alter table public.zoomdev_seiva_ledger enable row level security;
alter table public.zoomdev_subscriptions enable row level security;
alter table public.zoomdev_stripe_events enable row level security;

-- Sem policies: acesso direto anon/authenticated e bloqueado. Somente a API
-- usa service_role, apos validar a sessao e a titularidade do usuario.
