// ═══════════════════════════════════════════════════════════════════════════
// MIGRAÇÃO GOVERNADA DE PROTOCOLOS
//
// Quando a versão base de um PIC muda no código, este módulo aplica a migração
// preservando o histórico: a versão anterior nunca é apagada, e o administrador
// vê exatamente o que mudou e pode reverter.
//
// Vale para os 27 agentes e para a Sexta-Feira.
// ═══════════════════════════════════════════════════════════════════════════
import { store, save } from '../store.js';
import { PICS_AGENTES, VERSAO_PIC_AGENTES } from './picAgentes.js';

/** Estado versionado dos PICs de agente. */
export function estadoPicAgentes() {
  if (!store.picAgentes) {
    store.picAgentes = {
      versaoAtual: VERSAO_PIC_AGENTES,
      versoes: [{
        versao: VERSAO_PIC_AGENTES,
        criadoEm: new Date().toISOString(),
        origem: 'base',
        notas: 'Protocolos fundadores dos agentes com as doutrinas do Corpus Regenerativo.',
        pics: PICS_AGENTES,
      }],
    };
    save();
  }
  return store.picAgentes;
}

/**
 * Migra os PICs de agente para a versão do código, se houver divergência.
 * Retorna o relatório da migração (ou null se já estava em dia).
 */
export function migrarPicAgentes() {
  const estado = estadoPicAgentes();
  if (estado.versaoAtual === VERSAO_PIC_AGENTES) return null;

  const anterior = estado.versoes.find(v => v.versao === estado.versaoAtual);
  const antesPorId = Object.fromEntries((anterior?.pics || []).map(p => [p.agenteId, p]));

  const mudancas = [];
  for (const pic of PICS_AGENTES) {
    const antes = antesPorId[pic.agenteId];
    if (!antes) { mudancas.push({ agenteId: pic.agenteId, nome: pic.nome, tipo: 'novo' }); continue; }
    const diff = [];
    if (antes.conteudo.especialidade !== pic.conteudo.especialidade) diff.push('especialidade');
    if (JSON.stringify(antes.conteudo.cooperacao) !== JSON.stringify(pic.conteudo.cooperacao)) diff.push('cooperação');
    if (JSON.stringify(antes.conteudo.gatilhos) !== JSON.stringify(pic.conteudo.gatilhos)) diff.push('gatilhos');
    if ((antes.conteudo.doutrinas || '') !== (pic.conteudo.doutrinas || '')) diff.push('doutrinas');
    if (diff.length) mudancas.push({ agenteId: pic.agenteId, nome: pic.nome, tipo: 'atualizado', campos: diff });
  }
  for (const antigo of anterior?.pics || []) {
    if (!PICS_AGENTES.some(p => p.agenteId === antigo.agenteId)) {
      mudancas.push({ agenteId: antigo.agenteId, nome: antigo.nome, tipo: 'removido' });
    }
  }

  estado.versoes.push({
    versao: VERSAO_PIC_AGENTES,
    criadoEm: new Date().toISOString(),
    origem: 'migracao',
    notas: `Migração automática de v${estado.versaoAtual} para v${VERSAO_PIC_AGENTES}: ${mudancas.length} agente(s) afetado(s).`,
    pics: PICS_AGENTES,
    mudancas,
  });
  estado.versoes = estado.versoes.slice(-10);
  const de = estado.versaoAtual;
  estado.versaoAtual = VERSAO_PIC_AGENTES;
  save();

  return { de, para: VERSAO_PIC_AGENTES, mudancas, total: mudancas.length };
}

export function picsAgentesAtuais() {
  const estado = estadoPicAgentes();
  return estado.versoes.find(v => v.versao === estado.versaoAtual)?.pics || PICS_AGENTES;
}

export function rollbackPicAgentes(versaoAlvo) {
  const estado = estadoPicAgentes();
  const alvo = estado.versoes.find(v => v.versao === versaoAlvo);
  if (!alvo) throw Object.assign(new Error('Versão não encontrada no histórico.'), { status: 404 });
  if (alvo.versao === estado.versaoAtual) throw Object.assign(new Error('Esta já é a versão ativa.'), { status: 409 });
  estado.versaoAtual = versaoAlvo;
  save();
  return { versaoAtual: versaoAlvo };
}
