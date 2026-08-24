// Persistência simples em JSON (fundação: trocável por Postgres/Supabase via esta interface)
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';

const DB_FILE = path.join(config.dataDir, 'db.json');

const empty = () => ({
  users: {}, projects: {}, sessions: {}, carbonOrders: {},
  pic: null, picAgentes: null, nudges: {}, reports: {},
  radar: null, pulso: null, planosCompensacao: {},
  elenco: null, conselhos: {}, transacoes: {},
  sessoesPainel: {}, auditoria: [], vitrine: null, recuperacoes: {},
  sites: {},
  eventos: [], evidencias: {},
  modelosIA: {},
});

let db = empty();

export function load() {
  try {
    fs.mkdirSync(config.dataDir, { recursive: true });
    if (fs.existsSync(DB_FILE)) db = { ...empty(), ...JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) };
  } catch (e) {
    console.error('store: falha ao carregar, iniciando vazio', e.message);
    db = empty();
  }
}

let saveTimer = null;

/** A escrita em si, sem espera. Usada pelo agendamento e pelo encerramento. */
function gravarAgora() {
  clearTimeout(saveTimer);
  saveTimer = null;
  try {
    fs.mkdirSync(config.dataDir, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    return true;
  } catch (e) {
    console.error('store: falha ao salvar', e.message);
    return false;
  }
}

/**
 * Salvamento agendado: cem milissegundos de espera juntam as dez escritas de
 * uma mesma requisição numa só. É o que mantém o disco calmo.
 */
export function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(gravarAgora, 100);
}

/**
 * Salvamento imediato, para o encerramento do processo.
 *
 * Sem isto, cada deploy descartava a janela de escritas pendentes: o handler
 * de sinal chamava `save()`, que apenas AGENDA, e em seguida encerrava o
 * processo antes de o agendamento disparar. Para a cadeia de custódia o
 * estrago era pior que perder um dado: a evidência sumia do disco e o elo
 * seguinte apontava para um hash que não existia mais.
 */
export function salvarAgoraSePendente() {
  if (saveTimer === null) return false;
  return gravarAgora();
}

export const store = {
  get users() { return db.users; },
  get projects() { return db.projects; },
  get sessions() { return db.sessions; },
  get carbonOrders() { return db.carbonOrders; },
  // Estado do Protocolo de Instância Cognitiva da Sexta-Feira (versões + propostas)
  get pic() { return db.pic; },
  set pic(v) { db.pic = v; },
  // Nudges do Agent Bus por usuário: { [userId]: { enviados: [], dispensados: [] } }
  get nudges() { return db.nudges; },
  // Relatórios do ecossistema gerados pela Sexta-Feira
  get reports() { return db.reports; },
  // PICs versionados dos agentes da plataforma
  get picAgentes() { return db.picAgentes; },
  set picAgentes(v) { db.picAgentes = v; },
  // Radar de editais (descobertas e execuções) e pulso diário
  get radar() { return db.radar; },
  set radar(v) { db.radar = v; },
  get pulso() { return db.pulso; },
  set pulso(v) { db.pulso = v; },
  // Planos de compensação salvos por usuário
  get planosCompensacao() { return db.planosCompensacao; },
  // Elenco de agentes (ativação por casta) e atas do Conselho
  get elenco() { return db.elenco; },
  set elenco(v) { db.elenco = v; },
  get conselhos() { return db.conselhos; },
  // Transações de pagamento (Stripe e PIX)
  get transacoes() { return db.transacoes; },
  set transacoes(v) { db.transacoes = v; },
  // Sessões elevadas do painel de administração (token curto por acesso)
  get sessoesPainel() { return db.sessoesPainel; },
  // Trilha de auditoria das ações administrativas (500 mais recentes)
  get auditoria() { return db.auditoria; },
  set auditoria(v) { db.auditoria = v; },
  // Curadoria da vitrine da comunidade (destaques e ocultações)
  get vitrine() { return db.vitrine; },
  set vitrine(v) { db.vitrine = v; },
  // Pedidos de redefinição de senha, indexados pelo hash do token
  get recuperacoes() { return db.recuperacoes; },
  // Sites publicados: { [slug]: { projetoId, userId, publicadoEm } }.
  // Índice separado porque a busca é pelo endereço, não pelo projeto: varrer
  // todos os projetos a cada visita de um site publicado seria absurdo.
  get sites() { return db.sites; },
  get eventos() { return db.eventos; },
  set eventos(v) { db.eventos = v; },
  get evidencias() { return db.evidencias; },
};

export function id(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

load();
