import { config } from '../config.js';
import crypto from 'node:crypto';

const CACHE_MS = 60_000;
export const BUCKET_ANEXOS = 'zoomdev-anexos';
let ultimoTeste = null;

export function supabaseConfigurado() { return config.supabase.configurado; }

export async function supabaseFetch(caminho, opcoes = {}) {
  if (!supabaseConfigurado()) throw Object.assign(new Error('Supabase não configurado.'), { code: 'SUPABASE_NAO_CONFIGURADO' });
  return fetch(`${config.supabase.url}/rest/v1${caminho}`, {
    ...opcoes,
    headers: { apikey: config.supabase.serviceRoleKey, Authorization: `Bearer ${config.supabase.serviceRoleKey}`, Accept: 'application/json', ...opcoes.headers },
  });
}

function caminhoStorage(path) {
  return String(path).split('/').map(encodeURIComponent).join('/');
}

async function storageFetch(caminho, opcoes = {}) {
  if (!supabaseConfigurado()) throw Object.assign(new Error('Supabase não configurado.'), { code: 'SUPABASE_NAO_CONFIGURADO' });
  return fetch(`${config.supabase.url}/storage/v1${caminho}`, {
    ...opcoes,
    headers: { apikey: config.supabase.serviceRoleKey, Authorization: `Bearer ${config.supabase.serviceRoleKey}`, ...opcoes.headers },
  });
}

function nomeSeguro(nome = 'arquivo') {
  const limpo = String(nome).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
  return limpo || 'arquivo';
}

/** Guarda o binário em bucket privado; a rota ainda valida o dono do projeto. */
export async function guardarAnexoProjeto(projetoId, arquivo) {
  const id = crypto.randomUUID();
  const caminho = `${projetoId}/${id}-${nomeSeguro(arquivo.originalname)}`;
  const resposta = await storageFetch(`/object/${BUCKET_ANEXOS}/${caminhoStorage(caminho)}`, {
    method: 'POST',
    headers: { 'Content-Type': arquivo.mimetype || 'application/octet-stream', 'x-upsert': 'false' },
    body: arquivo.buffer,
  });
  if (!resposta.ok) throw Object.assign(new Error(`Não foi possível guardar o anexo (Storage HTTP ${resposta.status}).`), { status: 503, code: 'STORAGE_UPLOAD_FALHOU' });
  return { id, caminho };
}

export async function apagarAnexoProjeto(caminho) {
  if (!caminho) return;
  const resposta = await storageFetch(`/object/${BUCKET_ANEXOS}/${caminhoStorage(caminho)}`, { method: 'DELETE' });
  if (!resposta.ok && resposta.status !== 404) throw Object.assign(new Error(`Não foi possível remover o anexo (Storage HTTP ${resposta.status}).`), { status: 503 });
}

export async function baixarAnexoProjeto(caminho) {
  return storageFetch(`/object/${BUCKET_ANEXOS}/${caminhoStorage(caminho)}`);
}

export async function testarSupabase() {
  if (ultimoTeste && Date.now() - ultimoTeste.em < CACHE_MS) return { ...ultimoTeste.resultado, cache: true };
  let resultado;
  if (!supabaseConfigurado()) resultado = { ok: false, situacao: 'nao_configurado', mensagem: 'Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.' };
  else {
    try {
      const resposta = await supabaseFetch('/zoomdev_users?select=id&limit=1');
      if (resposta.ok) resultado = { ok: true, situacao: 'conectado', mensagem: 'Data API autenticada e schema ZoomDev disponível.' };
      else if (resposta.status === 404) resultado = { ok: false, situacao: 'migration_pendente', mensagem: 'A tabela zoomdev_users ainda não existe. Aplique a migration inicial.' };
      else resultado = { ok: false, situacao: 'erro_api', mensagem: 'A Data API respondeu com um erro.' };
    } catch { resultado = { ok: false, situacao: 'indisponivel', mensagem: 'Não foi possível conectar ao Supabase.' }; }
  }
  ultimoTeste = { em: Date.now(), resultado };
  return { ...resultado, cache: false };
}
function paraUsuario(u, agora) {
  return {
    id: u.id, auth_user_id: u.supabaseAuthId || null, email: u.email, nome: u.nome || String(u.email || '').split('@')[0] || 'Fundador',
    papel: u.papel || null, ativo: u.ativo !== false, plano: u.plano || 'free',
    creditos: Number.isFinite(u.creditos) ? u.creditos : 0, gamification: u.gamification || {},
    criado_em: u.criadoEm || agora, atualizado_em: agora,
  };
}

function paraProjeto(p, agora) {
  return {
    id: p.id, user_id: p.userId, nome: p.nome || 'Projeto sem nome', descricao: p.descricao || '',
    classificacao: p.classificacao || null, vertical: p.vertical || null, fase: p.fase || null,
    publicado: Boolean(p.publicado), dados: p, criado_em: p.criadoEm || agora, atualizado_em: agora,
  };
}

function projetoDaLinha(linha) {
  const dados = linha?.dados && typeof linha.dados === 'object' && !Array.isArray(linha.dados)
    ? linha.dados
    : {};
  return {
    ...dados,
    id: linha.id,
    userId: linha.user_id,
    nome: linha.nome,
    descricao: linha.descricao,
    classificacao: linha.classificacao,
    vertical: linha.vertical,
    fase: linha.fase,
    publicado: linha.publicado,
    criadoEm: dados.criadoEm || linha.criado_em,
  };
}

function paraTransacao(t, agora) {
  return {
    id: t.id, user_id: t.userId, tipo: t.tipo || 'outro', plano_id: t.planoId || null,
    descricao: t.descricao || 'Transação ZoomDev', valor: Number(t.valor || 0), moeda: t.moeda || 'BRL',
    creditos: Number(t.creditos || t.meta?.creditos || 0), status: t.status || 'pendente', metodo: t.metodo || 'interno',
    stripe_session_id: t.stripeSessionId || null, stripe_invoice_id: t.meta?.stripeInvoiceId || null,
    stripe_subscription_id: t.meta?.stripeSubscriptionId || null, dados: t,
    criado_em: t.criadoEm || agora, pago_em: t.pagoEm || null, cancelado_em: t.canceladoEm || null, atualizado_em: agora,
  };
}

function paraMovimentoSeiva(m, agora) {
  return {
    id: m.id, user_id: m.userId, tipo: m.tipo || 'outro', quantidade: Number(m.quantidade),
    saldo_apos: Number(m.saldoApos), descricao: m.descricao || 'Movimentação de Seiva',
    projeto_id: m.projetoId || null, transacao_id: m.transacaoId || null, origem: m.origem || 'sistema',
    dados: m, ocorrido_em: m.em || agora,
  };
}

function paraAssinatura(user, agora) {
  const assinatura = user.assinatura;
  if (!assinatura || !user?.id) return null;
  return {
    user_id: user.id, plano_id: assinatura.plano || user.plano || 'free', status: assinatura.status || 'active',
    stripe_customer_id: assinatura.stripeCustomerId || null, stripe_subscription_id: assinatura.stripeSubscriptionId || null,
    cancelar_no_fim_do_periodo: Boolean(assinatura.cancelarNoFimDoPeriodo),
    fim_do_periodo: assinatura.fimDoPeriodo || null, iniciada_em: assinatura.desde || null,
    encerrada_em: assinatura.encerradaEm || null, dados: assinatura, atualizado_em: agora,
  };
}

async function upsertEmLotes(tabela, linhas, conflito = 'id') {
  const TAMANHO_LOTE = 250;
  for (let inicio = 0; inicio < linhas.length; inicio += TAMANHO_LOTE) {
    const resposta = await supabaseFetch(`/${tabela}?on_conflict=${conflito}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(linhas.slice(inicio, inicio + TAMANHO_LOTE)),
    });
    if (!resposta.ok) throw Object.assign(new Error(`Supabase ${tabela}: HTTP ${resposta.status}`), { status: resposta.status, tabela });
  }
  return linhas.length;
}

/** Espelha os registros financeiros append-only no Postgres em lotes. */
async function espelharEconomia({ users = {}, transacoes = {}, seivaExtrato = [], stripeEventos = {} }, agora) {
  const movimentos = Array.isArray(seivaExtrato) ? seivaExtrato.filter(m => m?.id && m?.userId).map(m => paraMovimentoSeiva(m, agora)) : [];
  const compras = Object.values(transacoes).filter(t => t?.id && t?.userId).map(t => paraTransacao(t, agora));
  const assinaturas = Object.values(users).map(u => paraAssinatura(u, agora)).filter(Boolean);
  const eventos = Object.entries(stripeEventos || {}).map(([id, e]) => ({ id, tipo: e?.tipo || 'evento_desconhecido', recebido_em: e?.em || agora }));
  await upsertEmLotes('zoomdev_payment_transactions', compras);
  await upsertEmLotes('zoomdev_seiva_ledger', movimentos);
  await upsertEmLotes('zoomdev_subscriptions', assinaturas, 'user_id');
  await upsertEmLotes('zoomdev_stripe_events', eventos);
  return { transacoes: compras.length, movimentos: movimentos.length, assinaturas: assinaturas.length, eventos: eventos.length };
}

async function lerLinhasFinanceiras(tabela, select, ordem) {
  const tamanho = 1_000;
  const limite = 20_000;
  const linhas = [];
  for (let inicio = 0; inicio < limite; inicio += tamanho) {
    const resposta = await supabaseFetch(`/${tabela}?select=${select}&order=${ordem}&limit=${tamanho}&offset=${inicio}`);
    if (!resposta.ok) return null;
    const lote = await resposta.json();
    if (!Array.isArray(lote)) return null;
    linhas.push(...lote);
    if (lote.length < tamanho) break;
  }
  return linhas;
}

/**
 * Recupera o espelho financeiro ao iniciar. Se as tabelas ainda não existem
 * (migration pendente) ou estão vazias, devolve null e o JSON permanece como
 * fallback sem apagar nenhum registro local.
 */
export async function carregarEconomiaSupabase() {
  if (!supabaseConfigurado()) return null;
  try {
    const [transacoes, movimentos, assinaturas, eventos] = await Promise.all([
      lerLinhasFinanceiras('zoomdev_payment_transactions', 'dados', 'criado_em.desc'),
      lerLinhasFinanceiras('zoomdev_seiva_ledger', 'dados', 'ocorrido_em.desc'),
      lerLinhasFinanceiras('zoomdev_subscriptions', 'user_id,plano_id,status,stripe_customer_id,stripe_subscription_id,cancelar_no_fim_do_periodo,fim_do_periodo,iniciada_em,encerrada_em,dados', 'atualizado_em.desc'),
      lerLinhasFinanceiras('zoomdev_stripe_events', 'id,tipo,recebido_em', 'recebido_em.desc'),
    ]);
    if (!transacoes || !movimentos || !assinaturas || !eventos) return null;
    if (!transacoes.length && !movimentos.length && !assinaturas.length && !eventos.length) return null;
    return {
      transacoes: transacoes.map(l => l.dados).filter(d => d?.id),
      seivaExtrato: movimentos.map(l => l.dados).filter(d => d?.id),
      assinaturas,
      stripeEventos: Object.fromEntries(eventos.map(e => [e.id, { tipo: e.tipo, em: e.recebido_em }])),
    };
  } catch (e) {
    console.error('supabase: não foi possível recuperar a economia:', e.message);
    return null;
  }
}

/** Leitura principal dos projetos; `null` significa indisponível, não vazio. */
export async function listarProjetosSupabase(userId) {
  if (!supabaseConfigurado()) return null;
  const resposta = await supabaseFetch(`/zoomdev_projects?user_id=eq.${encodeURIComponent(userId)}&select=*&order=criado_em.desc`);
  if (!resposta.ok) return null;
  const linhas = await resposta.json();
  return Array.isArray(linhas) ? linhas.map(projetoDaLinha) : [];
}

export async function buscarProjetoSupabase(projectId, userId) {
  if (!supabaseConfigurado()) return null;
  const resposta = await supabaseFetch(`/zoomdev_projects?id=eq.${encodeURIComponent(projectId)}&user_id=eq.${encodeURIComponent(userId)}&select=*&limit=1`);
  if (!resposta.ok) return null;
  const linhas = await resposta.json();
  return linhas?.[0] ? projetoDaLinha(linhas[0]) : null;
}

/** Remove somente o projeto do titular. O banco remove o conteudo em cascata. */
export async function apagarProjetoSupabase(projectId, userId) {
  if (!supabaseConfigurado()) return { ignorado: true };
  const resposta = await supabaseFetch(`/zoomdev_projects?id=eq.${encodeURIComponent(projectId)}&user_id=eq.${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  });
  if (!resposta.ok) {
    throw Object.assign(new Error(`Supabase projeto: HTTP ${resposta.status}`), { status: 503, code: 'SUPABASE_PROJETO_EXCLUIR_FALHOU' });
  }
  return { ok: true };
}

export async function lerConteudoProjetoSupabase(projectId) {
  if (!supabaseConfigurado()) return null;
  const resposta = await supabaseFetch(`/zoomdev_project_content?project_id=eq.${encodeURIComponent(projectId)}&select=dados&limit=1`);
  if (!resposta.ok) return null;
  const linhas = await resposta.json();
  const dados = linhas?.[0]?.dados;
  return dados && typeof dados === 'object' && !Array.isArray(dados) ? dados : null;
}

/** Espelho transitório: JSON segue como backup enquanto cada rota é migrada. */
export async function espelharUsuariosProjetos({ users = {}, projects = {}, transacoes = {}, seivaExtrato = [], stripeEventos = {} }) {
  if (!supabaseConfigurado()) return { ignorado: true };
  const agora = new Date().toISOString();
  const upsert = async (tabela, linhas) => {
    if (!linhas.length) return 0;
    const resposta = await supabaseFetch(`/${tabela}?on_conflict=id`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(linhas),
    });
    if (!resposta.ok) {
      throw Object.assign(new Error(`Supabase ${tabela}: HTTP ${resposta.status}`), {
        status: resposta.status,
        tabela,
      });
    }
    return linhas.length;
  };
  const usuarios = Object.values(users).filter(u => u?.id && u?.email).map(u => paraUsuario(u, agora));
  const projetos = Object.values(projects).filter(p => p?.id && p?.userId && users[p.userId]).map(p => paraProjeto(p, agora));

  let usuariosEspelhados;
  try {
    usuariosEspelhados = await upsert('zoomdev_users', usuarios);
  } catch (erro) {
    // Um perfil legado pode ter recebido, antes desta migração, o UUID Auth
    // de outro perfil. O unique de auth_user_id recusa a troca direta e o
    // Postgres devolve 409. Soltamos APENAS os UUIDs que vamos reatribuir e
    // repetimos o upsert: nenhum usuário, projeto ou identidade Auth é apagado.
    const authIds = [...new Set(usuarios.map(u => u.auth_user_id).filter(Boolean))];
    if (erro.status !== 409 || !authIds.length) throw erro;

    const filtro = encodeURIComponent(`in.(${authIds.join(',')})`);
    const limpar = await supabaseFetch(`/zoomdev_users?auth_user_id=${filtro}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ auth_user_id: null, atualizado_em: agora }),
    });
    if (!limpar.ok) {
      throw Object.assign(new Error(`Supabase zoomdev_users: não foi possível reconciliar vínculos Auth (HTTP ${limpar.status})`), {
        status: limpar.status,
        tabela: 'zoomdev_users',
      });
    }
    console.warn(`supabase: reconciliando ${authIds.length} vínculo(s) Auth antes do espelho de usuários`);
    usuariosEspelhados = await upsert('zoomdev_users', usuarios);
  }

  const projetosEspelhados = await upsert('zoomdev_projects', projetos);
  const economia = await espelharEconomia({ users, transacoes, seivaExtrato, stripeEventos }, agora);
  return { usuarios: usuariosEspelhados, projetos: projetosEspelhados, economia };
}
/** Cria a identidade no Supabase Auth para contas novas; a sessão legada continua ativa durante a transição. */
export async function criarUsuarioSupabaseAuth({ email, password, nome, provedor = 'senha' }) {
  if (!supabaseConfigurado()) return null;
  const resposta = await fetch(`${config.supabase.url}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: config.supabase.serviceRoleKey,
      Authorization: `Bearer ${config.supabase.serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      ...(password ? { password } : {}),
      email_confirm: true,
      user_metadata: { nome: nome || email.split('@')[0], origem: 'zoomdev' },
      app_metadata: { zoomdev_provedor: provedor },
    }),
  });
  const corpo = await resposta.json().catch(() => ({}));
  if (!resposta.ok || !corpo?.id) {
    const erro = Object.assign(new Error('Não foi possível criar a identidade no Supabase Auth.'), {
      status: resposta.status === 409 || resposta.status === 422 ? 409 : 503,
      code: 'SUPABASE_AUTH_FALHOU',
    });
    throw erro;
  }
  return corpo.id;
}

/**
 * Mantém a senha do Supabase Auth igual à senha que a ZoomDev guarda como
 * hash. Sem isso, a recuperação parecia funcionar, mas o próximo login pelo
 * Supabase ainda aceitava a senha antiga.
 */
export async function atualizarSenhaSupabaseAuth(authUserId, password) {
  if (!supabaseConfigurado() || !authUserId) return { ignorado: true };
  const resposta = await fetch(`${config.supabase.url}/auth/v1/admin/users/${encodeURIComponent(authUserId)}`, {
    method: 'PUT',
    headers: {
      apikey: config.supabase.serviceRoleKey,
      Authorization: `Bearer ${config.supabase.serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  });
  if (!resposta.ok) {
    console.error(`Supabase Auth: não foi possível atualizar a senha (HTTP ${resposta.status}).`);
    throw Object.assign(new Error('Não foi possível atualizar a senha de acesso. Tente novamente em instantes.'), {
      status: 503,
      code: 'SUPABASE_SENHA_FALHOU',
      publico: true,
    });
  }
  return { ok: true };
}

/** Confere o access token no Supabase antes de confiar na identidade. */
export async function identidadeSupabase(accessToken) {
  if (!supabaseConfigurado() || !accessToken) return null;
  const resposta = await fetch(`${config.supabase.url}/auth/v1/user`, {
    headers: {
      apikey: config.supabase.serviceRoleKey,
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });
  if (!resposta.ok) {
    // Do not translate a server-side Supabase credential problem into a 401.
    // A 401 makes the browser erase a perfectly valid user session. The
    // operator needs a clear Railway/Supabase configuration signal instead.
    console.error(`Supabase Auth validation failed: HTTP ${resposta.status}`);
    throw Object.assign(new Error('O servidor nao conseguiu validar a sessao no Supabase. Verifique SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY na Railway.'), {
      status: 503,
      code: 'SUPABASE_AUTH_VALIDACAO_FALHOU',
      publico: true,
    });
  }
  const usuario = await resposta.json();
  return usuario?.id && usuario?.email ? usuario : null;
}
/** Espelha o conteúdo já retido pelo Studio; binários originais não entram no Supabase. */
export async function espelharConteudoProjeto(projectId, dados) {
  if (!supabaseConfigurado()) return { ignorado: true };
  const resposta = await supabaseFetch('/zoomdev_project_content?on_conflict=project_id', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify([{ project_id: projectId, dados, atualizado_em: new Date().toISOString() }]),
  });
  if (!resposta.ok) throw new Error(`Supabase conteúdo: HTTP ${resposta.status}`);
  return { ok: true };
}
