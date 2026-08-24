// ═══════════════════════════════════════════════════════════════════════════
// MODELOS DE IA POR PAPEL: configuração viva.
//
// config.modelos é o padrão de partida (env, decidido no deploy). O
// administrador troca qualquer papel em tempo real pelo painel; a escolha
// vive no store, vale na chamada seguinte e sobrevive a reinício. Restaurar
// o padrão apaga a escolha, voltando ao que o env definir.
// ═══════════════════════════════════════════════════════════════════════════
import { config } from '../config.js';
import { store, save } from '../store.js';
import { publicar } from './barramento.js';

// Preços oficiais por milhão de tokens (entrada/saída), conferidos em ago/2026.
export const MODELOS_DISPONIVEIS = [
  { id: 'claude-fable-5', nome: 'Fable 5', tier: 'Máximo', precoEntrada: 10, precoSaida: 50, nota: 'O tier mais capaz. Reserve para o que precisa do topo absoluto.' },
  { id: 'claude-opus-5', nome: 'Opus 5', tier: 'Premium', precoEntrada: 5, precoSaida: 25, nota: 'Qualidade de topo pela metade do preço do Fable.' },
  { id: 'claude-sonnet-5', nome: 'Sonnet 5', tier: 'Intermediário', precoEntrada: 3, precoSaida: 15, nota: 'O cavalo de batalha: código, conversa e pesquisa.' },
  { id: 'claude-haiku-4-5', nome: 'Haiku 4.5', tier: 'Leve', precoEntrada: 1, precoSaida: 5, nota: 'Classificação e extração em volume, custo mínimo e resposta rápida.' },
];

// Modelos capazes de usar a ferramenta de busca na internet. O tier leve não
// tem esse recurso: apontar o papel de pesquisa para ele derruba a varredura
// do radar, a pesquisa do plano e a Sexta-Feira com internet, todas com 400 da
// API e sem nenhuma pista de que a causa foi uma escolha no painel.
const BUSCAM_NA_INTERNET = new Set(['claude-fable-5', 'claude-opus-5', 'claude-sonnet-5']);

export const PAPEIS = [
  { id: 'plano', nome: 'Plano ZoomDev', usa: 'Os 5 agentes que escrevem as 14 seções do plano de negócios' },
  { id: 'pesquisa', nome: 'Pesquisa na internet', usa: 'Atlas (pesquisa do plano), Sexta-Feira com internet e Radar de Editais', exige: 'busca' },
  { id: 'codigo', nome: 'Código', usa: 'MVP Builder e console do Studio' },
  { id: 'chat', nome: 'Conversa e análise', usa: 'Sexta-Feira (chat, relatórios, autoevolução) e Conselho dos Agentes' },
  { id: 'extracao', nome: 'Classificação e extração', usa: 'Classificador de ideias, dossiê da pesquisa, pré-leitura e extração do radar' },
  { id: 'gerado', nome: 'MVPs gerados', usa: 'A IA dentro dos produtos que os founders publicam' },
];

/** O modelo em vigor para um papel: escolha do admin > env > modelo principal. */
export function modeloDoPapel(papel) {
  return store.modelosIA?.[papel] || config.modelos[papel] || config.model;
}

export function mapaAtual() {
  return PAPEIS.map(p => ({
    ...p,
    modelo: modeloDoPapel(p.id),
    padrao: config.modelos[p.id],
    personalizado: Boolean(store.modelosIA?.[p.id]),
  }));
}

/**
 * Troca o modelo de um papel (modelo=null restaura o padrão do env).
 * A troca vira evento no barramento: decisão operacional fica auditável.
 */
export function definirModelo(papel, modelo, { userId = null } = {}) {
  if (!PAPEIS.some(p => p.id === papel)) {
    throw Object.assign(new Error(`Papel desconhecido: ${papel}.`), { status: 400 });
  }
  const anterior = modeloDoPapel(papel);
  if (modelo === null || modelo === undefined || modelo === '') {
    if (store.modelosIA) delete store.modelosIA[papel];
  } else {
    if (!MODELOS_DISPONIVEIS.some(m => m.id === modelo)) {
      throw Object.assign(new Error(`Modelo fora da lista homologada: ${modelo}.`), { status: 400 });
    }
    const exigencia = PAPEIS.find(p => p.id === papel)?.exige;
    if (exigencia === 'busca' && !BUSCAM_NA_INTERNET.has(modelo)) {
      const nome = MODELOS_DISPONIVEIS.find(m => m.id === modelo)?.nome || modelo;
      throw Object.assign(
        new Error(`${nome} não faz busca na internet, e este módulo depende dela. Escolha Sonnet 5, Opus 5 ou Fable 5.`),
        { status: 400 },
      );
    }
    store.modelosIA = store.modelosIA || {};
    store.modelosIA[papel] = modelo;
  }
  save();
  const atual = modeloDoPapel(papel);
  if (atual !== anterior) {
    publicar('ia.modelo.trocado', { papel, de: anterior, para: atual }, { selo: 'ESTRATEGIA', userId });
  }
  return mapaAtual().find(p => p.id === papel);
}
