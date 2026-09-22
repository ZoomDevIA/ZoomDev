// Observabilidade operacional. Os logs completos continuam no provedor de
// hospedagem; aqui ficam apenas metadados seguros, persistidos e pesquisáveis
// pelo painel administrativo.
import { store, save, id } from '../store.js';
import { listarBackups } from './backup.js';

const LIMITE_INCIDENTES = 200;
const INICIO = Date.now();

function textoSeguro(valor, limite = 280) {
  return String(valor || 'Erro sem mensagem')
    .replace(/(sk_(?:live|test)_[A-Za-z0-9_]+|sk-ant-[A-Za-z0-9_-]+|Bearer\s+[A-Za-z0-9._-]+)/gi, '[redigido]')
    .replace(/[\r\n\t]+/g, ' ').slice(0, limite);
}

export function registrarIncidente({ ref, status = 500, code = 'ERRO_INTERNO', metodo, rota, erro }) {
  const operacao = store.operacao && typeof store.operacao === 'object' ? store.operacao : { incidentes: [] };
  const incidentes = Array.isArray(operacao.incidentes) ? operacao.incidentes : [];
  const incidente = {
    id: id('inc'), ref: String(ref || '').slice(0, 24) || null,
    em: new Date().toISOString(), status: Number(status) || 500,
    code: String(code || 'ERRO_INTERNO').slice(0, 80),
    metodo: String(metodo || 'PROCESSO').slice(0, 12),
    rota: String(rota || 'interno').slice(0, 180),
    mensagem: textoSeguro(erro?.message || erro),
  };
  incidentes.unshift(incidente);
  if (incidentes.length > LIMITE_INCIDENTES) incidentes.length = LIMITE_INCIDENTES;
  store.operacao = { ...operacao, incidentes };
  save();
  return incidente;
}

export function estadoOperacao() {
  const incidentes = Array.isArray(store.operacao?.incidentes) ? store.operacao.incidentes : [];
  const desde = Date.now() - (24 * 60 * 60 * 1000);
  const ultimas24h = incidentes.filter(i => new Date(i.em).getTime() >= desde);
  const backups = listarBackups();
  const ultimoBackup = backups[0] || null;
  const backupRecente = ultimoBackup && Date.now() - new Date(ultimoBackup.em).getTime() < 30 * 60 * 60 * 1000;
  return {
    iniciadoEm: new Date(INICIO).toISOString(),
    tempoNoArSegundos: Math.floor((Date.now() - INICIO) / 1000),
    incidentes24h: ultimas24h.length,
    ultimoIncidente: incidentes[0] || null,
    incidentes: incidentes.slice(0, 100),
    backups,
    backupRecente: Boolean(backupRecente),
  };
}
