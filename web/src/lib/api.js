// Cliente da API ZoomDev OS
let token = localStorage.getItem('zd_token') || null;

export function setToken(t) {
  token = t;
  if (t) localStorage.setItem('zd_token', t);
  else localStorage.removeItem('zd_token');
}

export function getToken() { return token; }

// Token da sessão elevada do painel. Fica em sessionStorage de propósito:
// fechou a aba, a janela administrativa se fecha junto.
let painelToken = sessionStorage.getItem('zd_painel') || null;

export function setPainelToken(t) {
  painelToken = t;
  if (t) sessionStorage.setItem('zd_painel', t);
  else sessionStorage.removeItem('zd_painel');
}

export function getPainelToken() { return painelToken; }

async function req(path, opts = {}) {
  const res = await fetch(`/api${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(painelToken ? { 'x-zd-painel': painelToken } : {}),
      ...(opts.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Erro ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  health: () => req('/health'),
  planos: () => req('/planos'),
  register: (body) => req('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => req('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => req('/me'),
  projetos: () => req('/projects'),
  projeto: (id) => req(`/projects/${id}`),
  ideacao: (body) => req('/projects/ideacao', { method: 'POST', body: JSON.stringify(body) }),
  concluirMissao: (projId, missaoId) => req(`/projects/${projId}/missoes/${missaoId}/concluir`, { method: 'POST' }),
  avancarFase: (projId) => req(`/projects/${projId}/avancar-fase`, { method: 'POST' }),
  carbonFatores: () => req('/carbon/fatores'),
  carbonCalcular: (body) => req('/carbon/calcular', { method: 'POST', body: JSON.stringify(body) }),
  carbonCompensar: (body) => req('/carbon/compensar', { method: 'POST', body: JSON.stringify(body) }),
  carbonPedidos: () => req('/carbon/pedidos'),
  carbonMarketplace: () => req('/carbon/marketplace'),
  carbonSequestro: (body) => req('/carbon/sequestro', { method: 'POST', body: JSON.stringify(body) }),
  carbonComprar: (body) => req('/carbon/comprar', { method: 'POST', body: JSON.stringify(body) }),
  agents: () => req('/agents'),
  notificacoes: () => req('/notificacoes'),
  editais: () => req('/editais'),
  editalAderencia: (editalId, projetoId) => req(`/editais/${editalId}/aderencia`, { method: 'POST', body: JSON.stringify({ projetoId }) }),
  // Radar de editais: varredura diária, matches explicáveis e alertas
  editaisRadar: () => req('/editais/radar'),
  editaisMatches: (minimo = 0) => req(`/editais/matches?minimo=${minimo}`),
  editaisMatchesProjeto: (projetoId) => req(`/editais/matches/${projetoId}`),
  editaisAlertas: () => req('/editais/alertas'),
  editaisAlertaLido: (id) => req(`/editais/alertas/${id}/lido`, { method: 'POST' }),
  editaisVarrer: () => req('/editais/varrer', { method: 'POST' }),
  // Calculadora e plano de compensação
  carbonPerfis: () => req('/carbon/perfis'),
  planoCompensacao: (body) => req('/carbon/plano-compensacao', { method: 'POST', body: JSON.stringify(body) }),
  planosCompensacao: () => req('/carbon/plano-compensacao'),
  analyze: (body) => req('/analyze', { method: 'POST', body: JSON.stringify(body) }),
  chat: (mensagens) => req('/chat', { method: 'POST', body: JSON.stringify({ mensagens }) }),
  chatHistorico: () => req('/chat'),
  // Agent Bus (nudges preditivos orquestrados pela Sexta-Feira)
  nudges: () => req('/nudges'),
  nudgeDispensar: (id) => req(`/nudges/${id}/dispensar`, { method: 'POST' }),
  nudgeAceitar: (id) => req(`/nudges/${id}/aceitar`, { method: 'POST' }),
  // Super dashboard do administrador (Sexta-Feira)
  elenco: () => req('/elenco'),
  elencoPics: () => req('/elenco/pics'),
  elencoAtivacao: (id, ativo) => req(`/elenco/${id}/ativacao`, { method: 'POST', body: JSON.stringify({ ativo }) }),
  mundo: () => req('/mundo'),
  conselhoConvocacao: (projId) => req(`/projects/${projId}/conselho/convocacao`),
  realizarConselho: (projId) => req(`/projects/${projId}/conselho`, { method: 'POST' }),
  conselhos: (projId) => req(`/projects/${projId}/conselho`),
  // MVP Builder
  mvp: (projId) => req(`/projects/${projId}/mvp`),
  // Pagamentos
  pagamentosStatus: () => req('/pagamentos/status'),
  pagamentosPacotes: () => req('/pagamentos/pacotes'),
  pagamentosPlanos: () => req('/pagamentos/planos'),
  transacoes: () => req('/pagamentos/transacoes'),
  assinar: (planoId) => req('/pagamentos/assinar', { method: 'POST', body: JSON.stringify({ planoId }) }),
  comprarSeiva: (pacoteId) => req('/pagamentos/seiva', { method: 'POST', body: JSON.stringify({ pacoteId }) }),
  pixCarbono: (pedidoId) => req(`/pagamentos/carbono/${pedidoId}`, { method: 'POST' }),
  confirmarPagamento: (txId) => req(`/pagamentos/transacoes/${txId}/confirmar`, { method: 'POST' }),
  cancelarPagamento: (txId) => req(`/pagamentos/transacoes/${txId}/cancelar`, { method: 'POST' }),
  adminOverview: () => req('/admin/overview'),
  adminChat: (mensagens) => req('/admin/chat', { method: 'POST', body: JSON.stringify({ mensagens }) }),
  adminChatHistorico: () => req('/admin/chat'),
  adminGerarRelatorio: () => req('/admin/relatorios', { method: 'POST' }),
  adminRelatorios: () => req('/admin/relatorios'),
  adminPic: () => req('/admin/pic'),
  adminPicPropor: () => req('/admin/pic/propor', { method: 'POST' }),
  adminPicAprovar: (id) => req(`/admin/pic/propostas/${id}/aprovar`, { method: 'POST' }),
  adminPicRejeitar: (id) => req(`/admin/pic/propostas/${id}/rejeitar`, { method: 'POST' }),
  adminPicRollback: (versao) => req('/admin/pic/rollback', { method: 'POST', body: JSON.stringify({ versao }) }),
  adminPicsAgentes: () => req('/admin/pics-agentes'),
  // Impacto Regenerativo 360° · Biogenesis COT BioTechnology
  biogenesis: () => req('/impacto/biogenesis'),
  biogen: () => req('/impacto/biogen'),
  simularImpacto: (body) => req('/impacto/simular', { method: 'POST', body: JSON.stringify(body) }),
  simularPrograma: (cenario = 'conservador') => req(`/impacto/simular-programa?cenario=${cenario}`),

  // ── Home pública: módulos, estatísticas e vitrine da comunidade ──────────
  home: (filtro = 'todos') => req(`/home?filtro=${filtro}`),
  vitrine: (filtro = 'todos') => req(`/home/vitrine?filtro=${filtro}`),
  publicarProjeto: (id, publicado = true) => req(`/projects/${id}/publicar`, { method: 'POST', body: JSON.stringify({ publicado }) }),
  curtirProjeto: (id) => req(`/projects/${id}/curtir`, { method: 'POST' }),
  projetoModulos: (id, modulos) => req(`/projects/${id}/modulos`, { method: 'POST', body: JSON.stringify(modulos) }),

  // ── Painel de administração (sessão elevada) ─────────────────────────────
  painelEstado: () => req('/painel/sessao'),
  painelEntrar: async (senha) => {
    const r = await req('/painel/sessao', { method: 'POST', body: JSON.stringify({ senha }) });
    setPainelToken(r.token);
    return r;
  },
  painelSair: async () => {
    try { await req('/painel/sessao', { method: 'DELETE' }); } finally { setPainelToken(null); }
  },
  painelContexto: () => req('/painel/contexto'),
  painelUsuarios: () => req('/painel/usuarios'),
  painelCriarUsuario: (body) => req('/painel/usuarios', { method: 'POST', body: JSON.stringify(body) }),
  painelAtualizarUsuario: (id, body) => req(`/painel/usuarios/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  painelDesativarUsuario: (id) => req(`/painel/usuarios/${id}`, { method: 'DELETE' }),
  painelVitrine: () => req('/painel/vitrine'),
  painelDestacar: (id, destacar) => req(`/painel/vitrine/${id}/destaque`, { method: 'POST', body: JSON.stringify({ destacar }) }),
  painelOcultar: (id, ocultar) => req(`/painel/vitrine/${id}/ocultar`, { method: 'POST', body: JSON.stringify({ ocultar }) }),
  painelAuditoria: (limite = 100) => req(`/painel/auditoria?limite=${limite}`),

  // ── Conta: senha, perfil e direitos do titular (LGPD) ────────────────────
  pedirRecuperacao: (email) => req('/auth/recuperar', { method: 'POST', body: JSON.stringify({ email }) }),
  redefinirSenha: (body) => req('/auth/redefinir', { method: 'POST', body: JSON.stringify(body) }),
  trocarSenha: (body) => req('/conta/senha', { method: 'POST', body: JSON.stringify(body) }),
  atualizarPerfil: (body) => req('/conta', { method: 'PATCH', body: JSON.stringify(body) }),
  aceitarTermos: () => req('/conta/termos', { method: 'POST' }),
  excluirConta: (body) => req('/conta', { method: 'DELETE', body: JSON.stringify(body) }),
  termosVersao: () => req('/termos-versao'),
};

// Baixa o pacote de dados do titular (LGPD, artigo 18)
export async function baixarMeusDados() {
  const res = await fetch('/api/conta/exportar', { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Não foi possível gerar a exportação.');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `zoomdev-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(a.href);
}

// Abre o relatório do ecossistema (HTML autenticado) em nova aba
export async function abrirRelatorio(relId) {
  const res = await fetch(`/api/admin/relatorios/${relId}.html`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Falha ao abrir o relatório.');
  const blob = await res.blob();
  window.open(URL.createObjectURL(blob.slice(0, blob.size, 'text/html')), '_blank');
}

// Baixa ou abre o Plano de Compensação
export async function baixarPlanoCompensacao(planoId, formato = 'docx') {
  const res = await fetch(`/api/carbon/plano-compensacao/${planoId}.${formato}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Falha ao gerar o documento.');
  const blob = await res.blob();
  if (formato === 'html') {
    window.open(URL.createObjectURL(blob.slice(0, blob.size, 'text/html')), '_blank');
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `plano-de-compensacao.${formato}`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// SSE da construção do MVP
export async function construirMvpSSE(projId, handlers) {
  const res = await fetch(`/api/projects/${projId}/mvp/construir`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Erro ${res.status}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop();
    for (const block of blocks) {
      const ev = block.match(/^event: (.+)$/m);
      const dt = block.match(/^data: (.+)$/m);
      if (ev && dt) { try { await handlers[ev[1]]?.(JSON.parse(dt[1])); } catch { /* ignore */ } }
    }
  }
}

export const mvpPreviewUrl = (projId, arquivo) => `/api/projects/${projId}/mvp/preview/${arquivo}`;

export async function baixarMvpZip(projId) {
  const res = await fetch(`/api/projects/${projId}/mvp.zip`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Falha ao gerar o ZIP do MVP.');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'mvp.zip';
  a.click();
  URL.revokeObjectURL(a.href);
}

// SSE da geração do plano (EventSource não envia headers → usa fetch streaming)
export async function gerarPlanoSSE(projId, handlers) {
  const res = await fetch(`/api/projects/${projId}/gerar-plano`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Erro ${res.status}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop();
    for (const block of blocks) {
      const evMatch = block.match(/^event: (.+)$/m);
      const dataMatch = block.match(/^data: (.+)$/m);
      if (evMatch && dataMatch) {
        try { handlers[evMatch[1]]?.(JSON.parse(dataMatch[1])); } catch { /* ignore */ }
      }
    }
  }
}

export function downloadUrl(projId, formato) {
  return `/api/projects/${projId}/plano.${formato}`;
}

export async function baixarPlano(projId, formato, nome) {
  const res = await fetch(downloadUrl(projId, formato), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Falha ao baixar o plano.');
  const ct = res.headers.get('Content-Type') || '';
  const blob = await res.blob();
  if (formato === 'pdf' && ct.includes('text/html')) {
    // Sem Chromium no servidor: abre HTML imprimível (Ctrl+P → salvar como PDF)
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    return { fallbackHtml: true };
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `plano-${(nome || 'projeto').toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.${formato}`;
  a.click();
  URL.revokeObjectURL(a.href);
  return { fallbackHtml: false };
}
