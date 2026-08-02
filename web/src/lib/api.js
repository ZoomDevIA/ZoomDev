// Cliente da API ZoomDev OS
let token = localStorage.getItem('zd_token') || null;

export function setToken(t) {
  token = t;
  if (t) localStorage.setItem('zd_token', t);
  else localStorage.removeItem('zd_token');
}

export function getToken() { return token; }

async function req(path, opts = {}) {
  const res = await fetch(`/api${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
  analyze: (body) => req('/analyze', { method: 'POST', body: JSON.stringify(body) }),
  chat: (mensagens) => req('/chat', { method: 'POST', body: JSON.stringify({ mensagens }) }),
  chatHistorico: () => req('/chat'),
  // Agent Bus (nudges preditivos orquestrados pela Sexta-Feira)
  nudges: () => req('/nudges'),
  nudgeDispensar: (id) => req(`/nudges/${id}/dispensar`, { method: 'POST' }),
  nudgeAceitar: (id) => req(`/nudges/${id}/aceitar`, { method: 'POST' }),
  // Super dashboard do administrador (Sexta-Feira)
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
  fomento: () => req('/impacto/fomento'),
  biogen: () => req('/impacto/biogen'),
  simularImpacto: (body) => req('/impacto/simular', { method: 'POST', body: JSON.stringify(body) }),
  simularPrograma: (cenario = 'conservador') => req(`/impacto/simular-programa?cenario=${cenario}`),
};

// Abre o relatório do ecossistema (HTML autenticado) em nova aba
export async function abrirRelatorio(relId) {
  const res = await fetch(`/api/admin/relatorios/${relId}.html`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Falha ao abrir o relatório.');
  const blob = await res.blob();
  window.open(URL.createObjectURL(blob.slice(0, blob.size, 'text/html')), '_blank');
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
