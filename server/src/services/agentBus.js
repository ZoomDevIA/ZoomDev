// ═══════════════════════════════════════════════════════════════════════════
// AGENT BUS: canal de orquestração da Sexta-Feira para os 25 agentes.
// Análise preditiva do estado de cada fundador → nudges gamificados, com o
// agente certo assinando cada mensagem. Máximo 2 nudges/dia por usuário;
// nudge dispensado (por chave) nunca volta a incomodar.
// ═══════════════════════════════════════════════════════════════════════════
import { store, save, id } from '../store.js';
import { radarProjeto, aderenciaHeuristica, diasParaPrazo } from './unicornio.js';
import { EDITAIS_SEED } from '../data/seeds.js';
import { picDoAgente } from '../protocols/picAgentes.js';
import { hojeBR } from './calendario.js';

const MAX_NUDGES_DIA = 2;

// O limite de dois nudges por dia é o dia do fundador, não o do servidor.
const hoje = () => hojeBR();

function estadoNudges(userId) {
  if (!store.nudges[userId]) store.nudges[userId] = { enviados: [], dispensados: [], aceitos: [] };
  return store.nudges[userId];
}

function assinatura(agenteId) {
  const pic = picDoAgente(agenteId);
  return pic ? { agenteId, agenteNome: pic.nome, agenteEmoji: pic.emoji } : { agenteId, agenteNome: 'ZoomDev', agenteEmoji: '✦' };
}

// Mapeia missão de validação → agente que "puxa" o assunto
function agenteDaMissao(missaoId) {
  if (missaoId.includes('entrevista')) return 'ux';
  if (missaoId.includes('landing')) return 'growth';
  if (missaoId.includes('concorrente')) return 'mercado';
  if (missaoId.includes('preco')) return 'cfo';
  return 'ceo';
}

/**
 * Gera os candidatos a nudge para um usuário, em ordem de prioridade.
 * Cada candidato tem `chave` estável (regra + alvo) para dedupe e dispensa.
 */
function candidatos(user) {
  const projetos = Object.values(store.projects).filter(p => p.userId === user.id);
  const conquistas = user.gamification?.conquistas || [];
  const lista = [];

  for (const p of projetos) {
    const principais = p.missoes.filter(m => m.tipo === 'principal');
    const pendentes = principais.filter(m => !m.concluida);

    // 1) Fase pronta para avançar: a maior vitória disponível
    if (principais.length > 0 && pendentes.length === 0 && p.fase !== 'escala') {
      lista.push({
        chave: `avancar:${p.id}:${p.fase}`, ...assinatura('ceo'),
        titulo: `${p.nome} está pronto para subir de nível!`,
        mensagem: `Todas as missões principais foram concluídas. Avance de fase agora e ganhe +120 XP: sua startup evolui na jornada Semente→Floresta. 🌳`,
        acao: { label: 'Avançar fase →', rota: `/projetos/${p.id}` },
      });
    }

    // 2) Ideia estruturada sem plano: o próximo passo óbvio que muitos adiam
    if (!p.plano && p.fase === 'ideacao') {
      lista.push({
        chave: `plano:${p.id}`, ...assinatura('ceo'),
        titulo: `Os 5 agentes estão prontos para ${p.nome}`,
        mensagem: `Antecipei a análise: sua ideia já tem base para o plano de negócios completo (com estorno automático se algo falhar). Plano gerado = +80 XP e a fase de Validação desbloqueada.`,
        acao: { label: 'Gerar plano →', rota: `/projetos/${p.id}` },
      });
    }

    // 3) Janela de fomento fechando: dinheiro não-diluitivo tem prazo.
    // Varre TODAS as janelas urgentes (score ≥ 70 e prazo ≤ 60 dias), não só a de maior score.
    const urgente = EDITAIS_SEED
      .map(e => ({ edital: e, score: aderenciaHeuristica(e, p), dias: diasParaPrazo(e) }))
      .filter(x => Number.isFinite(x.dias) && x.dias >= 0 && x.dias <= 60 && x.score >= 70)
      .sort((a, b) => b.score - a.score || a.dias - b.dias)[0];
    if (urgente) {
      lista.push({
        chave: `edital:${p.id}:${urgente.edital.id}`, ...assinatura('editais'),
        titulo: `${urgente.edital.nome}: ${urgente.dias} dias restantes`,
        mensagem: `Aderência de ${urgente.score}/100 com ${p.nome} (${urgente.edital.valor}). Projetos que aplicam com 30+ dias de antecedência têm o dobro da taxa de aprovação.`,
        acao: { label: 'Ver edital →', rota: '/editais' },
      });
    }

    // 4) Missão principal parada: empurrão do agente especialista
    if (p.plano && pendentes.length > 0) {
      const m = pendentes[0];
      lista.push({
        chave: `missao:${p.id}:${m.id}`, ...assinatura(agenteDaMissao(m.id)),
        titulo: `Missão em aberto: ${m.titulo}`,
        mensagem: `${m.descricao} Vale +${m.xp} XP e +10 🌿 de seiva. Validação real é o que separa projeto de startup.`,
        acao: { label: 'Ver missões →', rota: `/projetos/${p.id}` },
      });
    }

    // 5) Radar alto sem captação: hora de pensar como unicórnio
    const radar = radarProjeto(p, user);
    if (radar.score >= 80) {
      lista.push({
        chave: `radar80:${p.id}`, ...assinatura('investidor'),
        titulo: `${p.nome} entrou no Radar Unicórnio 🦄`,
        mensagem: `Score ${radar.score}/100 no ecossistema. Projetos neste patamar devem preparar pitch e dataroom ANTES de precisar do dinheiro. Vamos montar sua tese de captação?`,
        acao: { label: 'Preparar captação →', rota: '/investidores' },
      });
    }
  }

  // 6) Passivo ambiental nunca calculado: diferencial ESG dormindo
  if (projetos.length > 0 && !conquistas.includes('guardiao_floresta')) {
    lista.push({
      chave: 'carbono:calcular', ...assinatura('carbono'),
      titulo: 'Sua pegada de carbono ainda é uma incógnita',
      mensagem: `Investidores e editais pontuam ESG. Calcule o passivo ambiental em 2 minutos (GHG Protocol): +20 XP e a conquista Guardião da Floresta 🛡️.`,
      acao: { label: 'Calcular agora →', rota: '/carbonpay' },
    });
  }

  // 7) Calculou e não compensou: fechar o ciclo
  if (conquistas.includes('guardiao_floresta') && !conquistas.includes('carbono_neutro')) {
    lista.push({
      chave: 'carbono:compensar', ...assinatura('carbono'),
      titulo: 'Feche o ciclo: compense suas emissões',
      mensagem: `Você já conhece seu passivo. Compense com créditos verificados (Verra/Gold Standard) no CarbonPay: +60 XP e a conquista Pegada Compensada 🍃.`,
      acao: { label: 'Compensar →', rota: '/carbonpay' },
    });
  }

  return lista;
}

/**
 * Nudges do dia para o usuário. Gera uma vez por dia (persistido), respeita
 * dispensas e o teto diário. Retorna apenas os ativos (não dispensados).
 */
export function nudgesDoDia(user) {
  const estado = estadoNudges(user.id);
  const dia = hoje();

  let doDia = estado.enviados.filter(n => n.dia === dia);
  if (!doDia.length) {
    const dispensadas = new Set(estado.dispensados);
    const enviadasAntes = new Set(estado.enviados.map(n => n.chave));
    const novos = candidatos(user)
      .filter(c => !dispensadas.has(c.chave) && !enviadasAntes.has(c.chave))
      .slice(0, MAX_NUDGES_DIA)
      .map(c => ({ id: id('ndg'), dia, em: new Date().toISOString(), ...c }));
    if (novos.length) {
      estado.enviados.push(...novos);
      estado.enviados = estado.enviados.slice(-60);
      save();
    }
    doDia = novos;
  }
  return doDia.filter(n => !estado.dispensados.includes(n.chave));
}

export function dispensarNudge(user, nudgeId) {
  const estado = estadoNudges(user.id);
  const n = estado.enviados.find(x => x.id === nudgeId);
  if (!n) return false;
  if (!estado.dispensados.includes(n.chave)) estado.dispensados.push(n.chave);
  save();
  return true;
}

export function aceitarNudge(user, nudgeId) {
  const estado = estadoNudges(user.id);
  const n = estado.enviados.find(x => x.id === nudgeId);
  if (!n) return false;
  if (!estado.aceitos.includes(n.id)) estado.aceitos.push(n.id);
  // Aceitou = resolveu: não repete a mesma sugestão
  if (!estado.dispensados.includes(n.chave)) estado.dispensados.push(n.chave);
  save();
  return true;
}

/** KPI do Agent Bus para a Sexta-Feira: enviados, aceitos e taxa. */
export function estatisticasBus() {
  let enviados = 0, aceitos = 0, dispensados = 0;
  for (const e of Object.values(store.nudges)) {
    enviados += e.enviados.length;
    aceitos += e.aceitos.length;
    dispensados += e.dispensados.length;
  }
  return { enviados, aceitos, dispensados, taxaAceite: enviados ? Math.round((aceitos / enviados) * 100) : null };
}
