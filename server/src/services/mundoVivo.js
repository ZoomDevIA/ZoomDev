// ═══════════════════════════════════════════════════════════════════════════
// MUNDO VIVO — o roteiro do vale voxel
//
// Gera as falas e os movimentos dos agentes a partir do ESTADO REAL do
// ecossistema do usuário. Não é decoração: quando Curupira fala de área
// degradada, é porque existe um projeto de bioeconomia sem linha de base.
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { store } from '../store.js';
import { agentesAtivos } from './elenco.js';
import { radarProjeto } from './unicornio.js';
import { matchesDoProjeto } from './radarEditais.js';
import { FASE_LABEL } from './gamification.js';

/** Estações do vale — cada uma com posição no grid voxel. */
export const ESTACOES = [
  { id: 'laboratorio', nome: 'Laboratório Bio', emoji: '🧪', x: -14, z: -10, cor: '#00ff64', agentes: ['helix', 'gaia', 'curupira', 'seringueiro'] },
  { id: 'conselho', nome: 'Sala do Conselho', emoji: '⚖️', x: 0, z: -16, cor: '#ffd700', agentes: ['maia', 'ceo', 'athena'] },
  { id: 'carbono', nome: 'Mercado de Carbono', emoji: '🍃', x: 14, z: -10, cor: '#00c8ff', agentes: ['carbono', 'esg', 'tucuju'] },
  { id: 'editais', nome: 'Torre dos Editais', emoji: '📡', x: 14, z: 8, cor: '#a855f7', agentes: ['editais', 'chronos', 'juridico'] },
  { id: 'capital', nome: 'Praça do Capital', emoji: '✨', x: -14, z: 8, cor: '#ffd700', agentes: ['orion', 'investidor', 'cfo', 'atlas'] },
  { id: 'oficina', nome: 'Oficina', emoji: '⚙️', x: 0, z: 14, cor: '#00c8ff', agentes: ['cto', 'nexus', 'growth', 'mercado'] },
];

const rnd = (seed) => { const x = Math.sin(seed) * 10000; return x - Math.floor(x); };

// ── Avatares ──────────────────────────────────────────────────────────────
// O rosto do personagem voxel usa o avatar oficial do agente. Enquanto a arte
// de um agente não existe, o emoji vira o rosto — e o PNG é adotado sozinho
// assim que o arquivo aparecer, sem mexer em código.
// Caminhos resolvidos a partir DESTE módulo, nunca de process.cwd(): em
// produção o `npm start -w server` roda com o diretório de trabalho em
// server/, e um caminho relativo ao cwd apontaria para o lugar errado.
const DIRS_AVATARES = [
  new URL('../../../web/dist/assets/agents/', import.meta.url).pathname,   // build de produção
  new URL('../../../web/public/assets/agents/', import.meta.url).pathname, // desenvolvimento
];

let cacheAvatares = null;
function avataresDisponiveis() {
  try {
    const dir = DIRS_AVATARES.find(d => fs.existsSync(d));
    if (!dir) return new Set();
    const mtime = fs.statSync(dir).mtimeMs;
    if (!cacheAvatares || cacheAvatares.dir !== dir || cacheAvatares.mtime !== mtime) {
      cacheAvatares = {
        dir, mtime,
        ids: new Set(fs.readdirSync(dir)
          .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
          .map(f => f.replace(/\.[^.]+$/, ''))),
      };
    }
    return cacheAvatares.ids;
  } catch {
    return new Set();
  }
}

export function avatarDe(agenteId) {
  return avataresDisponiveis().has(agenteId) ? `/assets/agents/${agenteId}.png` : null;
}

/**
 * Monta a cena: agentes ativos posicionados em suas estações, com falas
 * derivadas do estado real dos projetos do usuário.
 */
export function cena(user) {
  const projetos = Object.values(store.projects).filter(p => p.userId === user.id);
  const principal = projetos[0] || null;
  const radar = principal ? radarProjeto(principal, user) : null;
  const matches = principal ? matchesDoProjeto(principal) : [];
  const melhor = matches[0] || null;
  const missoesPend = principal ? (principal.missoes || []).filter(m => m.tipo === 'principal' && !m.concluida) : [];
  const conquistas = user.gamification?.conquistas || [];
  const bio = principal?.classificacao === 'biostartup';

  // Falas por agente, ancoradas em dado real
  const falas = {
    maia: principal
      ? `${principal.nome} está em ${FASE_LABEL[principal.fase] || principal.fase}. Vamos transformar hipótese em evidência?`
      : 'Descreva sua ideia e eu te acompanho da primeira linha ao primeiro contrato.',
    ceo: radar ? `Radar em ${radar.score}/100. O gargalo hoje é ${radar.dimensoes.reduce((m, d) => (d.pontos / d.max < m.pontos / m.max ? d : m)).label.toLowerCase()}.` : 'Toda grande empresa começou com uma ideia mal formulada. Comece.',
    editais: melhor
      ? `${melhor.edital}: ${melhor.score}/100 de aderência${melhor.dias !== null ? `, ${melhor.dias} dias de prazo` : ''}.`
      : 'Varrendo as chamadas de fomento abertas no país…',
    chronos: melhor && melhor.dias !== null && melhor.dias <= 45
      ? `Atenção ao relógio: ${melhor.dias} dias até o fechamento.`
      : 'Cada janela tem sua estação. Timing é estratégia.',
    carbono: conquistas.includes('guardiao_floresta')
      ? (conquistas.includes('carbono_neutro') ? 'Ciclo fechado: medido e compensado com créditos verificados.' : 'Passivo medido. Falta compensar o residual.')
      : 'Sua pegada ainda é uma incógnita. Vamos medir?',
    esg: 'Impacto sem indicador auditável não passa em due diligence.',
    helix: bio ? 'Delineamento com testemunha pareada é o que separa alegação de evidência.' : 'Todo dado precisa de um selo de confiança.',
    gaia: bio ? 'Regenerar é melhor negócio que extrair — e dá para provar com número.' : 'Existe impacto positivo escondido nesse projeto.',
    curupira: bio ? 'Antes de intervir, registre a linha de base da biodiversidade.' : 'A floresta guarda o que ninguém copia.',
    seringueiro: 'A cadeia produtiva precisa agregar valor onde a matéria-prima nasce.',
    iara: 'A água conta a história do território antes de qualquer relatório.',
    boto: 'Nenhuma cadeia da sociobiodiversidade se sustenta sem repartição justa de benefícios.',
    tucuju: 'O Artigo 6 abre portas que o mercado voluntário sozinho não abre.',
    orion: radar && radar.score >= 70 ? 'Esse patamar já conversa com capital climático internacional.' : 'Fomento não-diluitivo primeiro. Equity depois.',
    investidor: radar && radar.score >= 80 ? 'Hora de preparar dataroom — antes de precisar do dinheiro.' : 'Tração fala mais alto que projeção.',
    cfo: 'Unit economics clara antes de escalar. Sempre.',
    atlas: 'Estrutura societária internacional se desenha antes de precisar dela.',
    athena: 'Governança é o que faz o projeto sobreviver à auditoria mais dura.',
    juridico: 'Acordo de sócios e vesting resolvidos hoje evitam a briga de amanhã.',
    cto: 'Nesta fase, otimize para velocidade de aprendizado, não para escala.',
    nexus: 'Nenhum dado ilhado, nenhum agente cego.',
    growth: 'Retenção antes de aquisição. Sempre nessa ordem.',
    mercado: 'TAM inflado é a principal causa de rejeição em comitê.',
  };

  const ativos = agentesAtivos();
  const habitantes = [];
  for (const est of ESTACOES) {
    const naEstacao = est.agentes.filter(aid => ativos.some(a => a.id === aid));
    naEstacao.forEach((aid, i) => {
      const ag = ativos.find(a => a.id === aid);
      const seed = aid.charCodeAt(0) * 37 + i * 13;
      habitantes.push({
        id: ag.id, nome: ag.nome, emoji: ag.emoji, cor: ag.cor || '#00ff64', casta: ag.casta,
        avatar: avatarDe(ag.id),
        estacao: est.id, estacaoNome: est.nome,
        // posição base ao redor da estação
        x: est.x + (i % 3 - 1) * 2.4 + (rnd(seed) - 0.5),
        z: est.z + Math.floor(i / 3) * 2.4 + (rnd(seed + 1) - 0.5),
        fala: falas[ag.id] || `${ag.papel}.`,
        // ritmo próprio de caminhada, para o vale não parecer coreografado
        velocidade: 0.5 + rnd(seed + 2) * 0.5,
        raio: 1.1 + rnd(seed + 3) * 0.9,
        fase: rnd(seed + 4) * Math.PI * 2,
      });
    });
  }

  // Diálogos entre agentes — a interoperabilidade ganhando forma visível
  const dialogos = [];
  if (principal) {
    if (bio) dialogos.push({ de: 'curupira', para: 'carbono', texto: 'Área mapeada. Quanto isso vira em crédito?' });
    if (melhor) dialogos.push({ de: 'editais', para: 'chronos', texto: `${melhor.edital} fecha em ${melhor.dias} dias. Dá tempo?` });
    if (missoesPend.length) dialogos.push({ de: 'ceo', para: 'maia', texto: `${missoesPend.length} missão(ões) travando o avanço.` });
    if (radar && radar.score >= 70) dialogos.push({ de: 'investidor', para: 'orion', texto: 'Esse já está pronto para conversar com fundo.' });
    dialogos.push({ de: 'maia', para: 'helix', texto: 'Qual evidência falta para sustentar essa tese?' });
  }

  return {
    estacoes: ESTACOES,
    habitantes,
    dialogos,
    contexto: {
      projeto: principal ? { id: principal.id, nome: principal.nome, fase: principal.fase, classificacao: principal.classificacao } : null,
      radar: radar ? { score: radar.score, tier: radar.tier } : null,
      melhorEdital: melhor ? { nome: melhor.edital, score: melhor.score, dias: melhor.dias } : null,
      missoesPendentes: missoesPend.length,
      nivel: user.gamification?.xp || 0,
    },
  };
}
