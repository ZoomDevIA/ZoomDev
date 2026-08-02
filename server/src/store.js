// Persistência simples em JSON (fundação — trocável por Postgres/Supabase via esta interface)
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';

const DB_FILE = path.join(config.dataDir, 'db.json');

const empty = () => ({
  users: {}, projects: {}, sessions: {}, carbonOrders: {},
  pic: null, picAgentes: null, nudges: {}, reports: {},
  radar: null, pulso: null, planosCompensacao: {},
  elenco: null, conselhos: {}, transacoes: {},
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
export function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.mkdirSync(config.dataDir, { recursive: true });
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    } catch (e) {
      console.error('store: falha ao salvar', e.message);
    }
  }, 100);
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
};

export function id(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

load();
