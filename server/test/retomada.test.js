// ═══════════════════════════════════════════════════════════════════════════
// TESTES DA RETOMADA · dinheiro do fundador quando o servidor cai
//
// O caso real que originou este arquivo: o Neo clicou em construir o MVP
// enquanto um deploy subia. A seiva saiu, o processo morreu antes do estorno,
// o botão ficou preso em "Construindo…" e o projeto guardou "construindo"
// para sempre. Nenhum log, nenhum erro, nenhuma forma de retomar.
// ═══════════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const DIR_TESTE = new URL('../../.tmp-test-retomada/', import.meta.url).pathname;
fs.rmSync(DIR_TESTE, { recursive: true, force: true });
process.env.ZOOMDEV_DATA_DIR = DIR_TESTE;

const { store } = await import('../src/store.js');
const { config } = await import('../src/config.js');
const { jaEmAndamento, varrerInterrompidos, LIMITE_MS } = await import('../src/services/retomada.js');

const agora = () => new Date().toISOString();
const atras = (ms) => new Date(Date.now() - ms).toISOString();

function cenario({ mvp, geracao, creditos = 100 }) {
  const uid = `u_${Math.round(Math.random() * 1e9)}`;
  const pid = `p_${Math.round(Math.random() * 1e9)}`;
  store.users[uid] = { id: uid, email: `${uid}@zd.dev`, creditos };
  store.projects[pid] = { id: pid, userId: uid, nome: 'Projeto', ...(mvp ? { mvp } : {}), ...(geracao ? { geracao } : {}) };
  return { user: store.users[uid], proj: store.projects[pid] };
}

test('retomada de trabalhos longos', async (t) => {
  await t.test('trabalho em andamento agora bloqueia um segundo pedido', () => {
    const { proj } = cenario({ mvp: { status: 'construindo', iniciadoEm: agora() } });
    const r = jaEmAndamento(proj, 'mvp');
    assert.ok(r, 'a segunda construção tem que ser recusada');
    assert.match(r.nome, /MVP/);
  });

  await t.test('trabalho antigo demais não bloqueia: é resto de queda', () => {
    const { proj } = cenario({ mvp: { status: 'construindo', iniciadoEm: atras(LIMITE_MS + 60_000) } });
    assert.equal(jaEmAndamento(proj, 'mvp'), null, 'depois do limite, o fundador pode tentar de novo');
  });

  await t.test('projeto parado não bloqueia nada', () => {
    const { proj } = cenario({ mvp: { status: 'pronto' } });
    assert.equal(jaEmAndamento(proj, 'mvp'), null);
    assert.equal(jaEmAndamento(proj, 'documento'), null);
    assert.equal(jaEmAndamento({}, 'mvp'), null);
  });

  await t.test('a varredura da partida encerra o pendurado e devolve a seiva', () => {
    const mvpCaido = cenario({ mvp: { status: 'construindo', iniciadoEm: agora() }, creditos: 40 });
    const planoCaido = cenario({ geracao: { status: 'executando', iniciadaEm: agora() }, creditos: 10 });
    const intacto = cenario({ mvp: { status: 'pronto' }, creditos: 70 });

    const r = varrerInterrompidos();
    assert.ok(r.encerrados >= 2, 'os dois trabalhos pendurados foram encerrados');

    assert.equal(mvpCaido.proj.mvp.status, 'interrompido');
    assert.equal(mvpCaido.proj.mvp.seivaEstornada, config.credits.mvpBuild);
    assert.equal(mvpCaido.user.creditos, 40 + config.credits.mvpBuild, 'a seiva do MVP voltou');
    assert.match(mvpCaido.proj.mvp.motivo, /servidor reiniciou/i);

    assert.equal(planoCaido.proj.geracao.status, 'interrompido');
    assert.equal(planoCaido.user.creditos, 10 + config.credits.planGeneration, 'a seiva do plano voltou');

    assert.equal(intacto.user.creditos, 70, 'quem não estava executando não recebe nada');
  });

  await t.test('varrer duas vezes não estorna duas vezes', () => {
    const { user, proj } = cenario({ mvp: { status: 'construindo', iniciadoEm: agora() }, creditos: 0 });
    varrerInterrompidos();
    const depoisDaPrimeira = user.creditos;
    varrerInterrompidos();
    assert.equal(user.creditos, depoisDaPrimeira, 'o estorno é idempotente');
    assert.equal(proj.mvp.status, 'interrompido');
  });

  await t.test('a interrupção vira evento no barramento, com selo verificado', () => {
    cenario({ mvp: { status: 'construindo', iniciadoEm: agora() } });
    varrerInterrompidos();
    const ev = (store.eventos || []).find(e => e.tipo === 'trabalho.interrompido');
    assert.ok(ev, 'a queda fica registrada');
    assert.equal(ev.selo, 'VERIFICADO');
    assert.equal(ev.dados.tipo, 'mvp');
  });
});

test('encerramento do processo grava o que estava pendente', async (t) => {
  const { save, salvarAgoraSePendente } = await import('../src/store.js');

  await t.test('sem nada agendado, não escreve à toa', () => {
    salvarAgoraSePendente();
    assert.equal(salvarAgoraSePendente(), false);
  });

  await t.test('com escrita agendada, o encerramento grava na hora', () => {
    store.users.marcador_encerramento = { id: 'marcador_encerramento', creditos: 1 };
    save(); // agenda, com cem milissegundos de espera
    assert.equal(salvarAgoraSePendente(), true, 'a gravação imediata aconteceu');

    const db = JSON.parse(fs.readFileSync(`${DIR_TESTE}db.json`, 'utf8'));
    assert.ok(db.users.marcador_encerramento, 'o dado pendente chegou ao disco antes do exit');
  });
});
