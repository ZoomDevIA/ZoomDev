// Persistência simples em JSON (fundação — trocável por Postgres/Supabase via esta interface)
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';

const DB_FILE = path.join(config.dataDir, 'db.json');

const empty = () => ({ users: {}, projects: {}, sessions: {}, carbonOrders: {} });

let db = empty();

export function load() {
  try {
    fs.mkdirSync(config.dataDir, { recursive: true });
    if (fs.existsSync(DB_FILE)) db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
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
};

export function id(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

load();
