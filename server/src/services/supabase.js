import { config } from '../config.js';

const CACHE_MS = 60_000;
let ultimoTeste = null;

export function supabaseConfigurado() { return config.supabase.configurado; }

export async function supabaseFetch(caminho, opcoes = {}) {
  if (!supabaseConfigurado()) throw Object.assign(new Error('Supabase não configurado.'), { code: 'SUPABASE_NAO_CONFIGURADO' });
  return fetch(`${config.supabase.url}/rest/v1${caminho}`, {
    ...opcoes,
    headers: { apikey: config.supabase.serviceRoleKey, Authorization: `Bearer ${config.supabase.serviceRoleKey}`, Accept: 'application/json', ...opcoes.headers },
  });
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

export async function lerConteudoProjetoSupabase(projectId) {
  if (!supabaseConfigurado()) return null;
  const resposta = await supabaseFetch(`/zoomdev_project_content?project_id=eq.${encodeURIComponent(projectId)}&select=dados&limit=1`);
  if (!resposta.ok) return null;
  const linhas = await resposta.json();
  const dados = linhas?.[0]?.dados;
  return dados && typeof dados === 'object' && !Array.isArray(dados) ? dados : null;
}

/** Espelho transitório: JSON segue como backup enquanto cada rota é migrada. */
export async function espelharUsuariosProjetos({ users = {}, projects = {} }) {
  if (!supabaseConfigurado()) return { ignorado: true };
  const agora = new Date().toISOString();
  const upsert = async (tabela, linhas) => {
    if (!linhas.length) return 0;
    const resposta = await supabaseFetch(`/${tabela}?on_conflict=id`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(linhas),
    });
    if (!resposta.ok) throw new Error(`Supabase ${tabela}: HTTP ${resposta.status}`);
    return linhas.length;
  };
  const usuarios = Object.values(users).filter(u => u?.id && u?.email).map(u => paraUsuario(u, agora));
  const projetos = Object.values(projects).filter(p => p?.id && p?.userId && users[p.userId]).map(p => paraProjeto(p, agora));
  return { usuarios: await upsert('zoomdev_users', usuarios), projetos: await upsert('zoomdev_projects', projetos) };
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
  if (!resposta.ok) return null;
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
