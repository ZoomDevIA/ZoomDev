import { store, id } from '../store.js';

const LIMITE_EXTRATO = 20_000;

function registros() {
  if (!Array.isArray(store.seivaExtrato)) store.seivaExtrato = [];
  return store.seivaExtrato;
}

/**
 * Única porta para alterar saldo de Seiva. A linha é append-only: não existe
 * rota de edição ou remoção, para que o extrato e a auditoria contem a mesma
 * história.
 */
export function movimentarSeiva({
  user, quantidade, tipo, descricao, projetoId = null, transacaoId = null,
  origem = 'sistema', meta = null,
}) {
  const delta = Number(quantidade);
  if (!user?.id) throw new Error('Usuário inválido para movimentação de Seiva.');
  if (!Number.isInteger(delta) || delta === 0) throw new Error('A movimentação de Seiva deve ter valor inteiro e diferente de zero.');

  const antes = Number(user.creditos || 0);
  const saldoApos = antes + delta;
  if (saldoApos < 0) {
    throw Object.assign(new Error(`Seiva insuficiente: você tem ${antes} e precisa de ${Math.abs(delta)}.`), { status: 402 });
  }

  user.creditos = saldoApos;
  const movimento = {
    id: id('sev'), userId: user.id, em: new Date().toISOString(),
    tipo: String(tipo || 'outro').slice(0, 60),
    quantidade: delta, saldoApos,
    descricao: String(descricao || 'Movimentação de Seiva').slice(0, 280),
    projetoId, transacaoId, origem: String(origem || 'sistema').slice(0, 60),
    ...(meta && typeof meta === 'object' ? { meta } : {}),
  };
  const extrato = registros();
  extrato.unshift(movimento);
  if (extrato.length > LIMITE_EXTRATO) extrato.length = LIMITE_EXTRATO;
  return movimento;
}

export function extratoSeiva(userId, limite = 100) {
  const teto = Math.min(Math.max(Number(limite) || 100, 1), 200);
  return registros().filter(m => m.userId === userId).slice(0, teto);
}

// Usuarios criados antes deste recurso ja possuem saldo, mas nao tinham uma
// linha que explicasse sua origem. Criamos uma unica abertura, sem alterar o
// saldo, antes de qualquer nova movimentacao automatica do servidor.
export function registrarSaldosLegados() {
  const extrato = registros();
  const usuariosComExtrato = new Set(extrato.map(movimento => movimento.userId));
  let incluidos = 0;

  for (const user of Object.values(store.users || {})) {
    const saldo = Number(user.creditos || 0);
    if (usuariosComExtrato.has(user.id) || !Number.isInteger(saldo) || saldo <= 0) continue;

    extrato.unshift({
      id: id('sev'), userId: user.id, em: new Date().toISOString(),
      tipo: 'saldo_abertura', quantidade: saldo, saldoApos: saldo,
      descricao: 'Saldo existente antes da implantacao do extrato',
      projetoId: null, transacaoId: null, origem: 'migracao_extrato',
    });
    usuariosComExtrato.add(user.id);
    incluidos += 1;
  }

  if (extrato.length > LIMITE_EXTRATO) extrato.length = LIMITE_EXTRATO;
  return incluidos;
}

export function ajustarSeivaAdministrativo({ user, quantidade, motivo, admin }) {
  const delta = Number(quantidade);
  const justificativa = String(motivo || '').trim();
  if (!Number.isInteger(delta) || delta === 0 || Math.abs(delta) > 100_000) {
    throw Object.assign(new Error('Informe um ajuste inteiro entre -100.000 e 100.000 Seivas.'), { status: 400 });
  }
  if (justificativa.length < 5 || justificativa.length > 280) {
    throw Object.assign(new Error('Explique o ajuste em 5 a 280 caracteres.'), { status: 400 });
  }
  return movimentarSeiva({
    user,
    quantidade: delta,
    tipo: delta > 0 ? 'ajuste_admin_credito' : 'ajuste_admin_debito',
    descricao: justificativa,
    origem: 'painel_admin',
    meta: { adminId: admin?.id || null, adminEmail: admin?.email || null },
  });
}
