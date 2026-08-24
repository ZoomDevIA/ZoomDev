// ═══════════════════════════════════════════════════════════════════════════
// RETOMADA: o que acontece quando o servidor cai no meio de um trabalho longo
//
// Gerar o plano leva minutos; construir o MVP também. Nesse intervalo o
// fundador já pagou (a seiva sai na entrada) e o projeto está marcado como
// "executando". Se o processo morre ali — deploy, falta de memória, reinício
// da hospedagem — o estorno do `catch` nunca roda, porque não existe mais
// processo para rodá-lo. O resultado era o pior dos mundos: seiva debitada,
// nenhum documento entregue, e o projeto preso em "executando" para sempre,
// porque nada no sistema voltava a olhar aquele estado.
//
// Duas peças resolvem, e as duas são necessárias:
//
//   1. VARREDURA NA PARTIDA. Todo trabalho que ficou pendurado de uma vida
//      anterior do processo é encerrado como interrompido e a seiva volta.
//      Fica registrado no projeto, para a tela poder explicar o que houve.
//
//   2. TRAVA DE REENTRÂNCIA. Enquanto um trabalho está de pé de verdade,
//      pedir outro igual é recusado em vez de cobrar de novo. Recarregar a
//      aba e clicar outra vez custava o dobro e deixava duas execuções
//      escrevendo no mesmo projeto.
//
// O tempo limite existe porque um trabalho "executando" há uma hora não está
// executando: é resto de uma queda que a varredura não pegou.
// ═══════════════════════════════════════════════════════════════════════════
import { store, save } from '../store.js';
import { config } from '../config.js';
import { publicar } from './barramento.js';

/** Depois disto, um trabalho "em andamento" é considerado resto de queda. */
export const LIMITE_MS = 30 * 60 * 1000;

// Os dois trabalhos longos da plataforma, com onde moram e quanto custam.
const TRABALHOS = {
  documento: {
    campo: 'geracao',
    ativo: 'executando',
    custo: () => config.credits.planGeneration,
    nome: 'a geração do plano',
    inicio: g => g.iniciadaEm,
  },
  mvp: {
    campo: 'mvp',
    ativo: 'construindo',
    custo: () => config.credits.mvpBuild,
    nome: 'a construção do MVP',
    inicio: m => m.iniciadoEm,
  },
};

const idade = (iso) => {
  const t = Date.parse(iso || '');
  return Number.isFinite(t) ? Date.now() - t : Infinity;
};

/**
 * Este trabalho já está de pé neste projeto?
 *
 * Devolve `null` quando pode começar, ou os dados do trabalho em andamento
 * quando a rota deve recusar.
 */
export function jaEmAndamento(proj, tipo) {
  const t = TRABALHOS[tipo];
  if (!t) return null;
  const estado = proj?.[t.campo];
  if (!estado || estado.status !== t.ativo) return null;
  // Resto de queda antiga não bloqueia ninguém: é liberado e a rota segue.
  if (idade(t.inicio(estado)) > LIMITE_MS) return null;
  return { nome: t.nome, desde: t.inicio(estado) };
}

/**
 * Encerra um trabalho pendurado e devolve a seiva a quem pagou.
 * Silencioso e idempotente: chamar duas vezes não estorna duas vezes.
 */
function encerrar(proj, tipo, motivo) {
  const t = TRABALHOS[tipo];
  const estado = proj[t.campo];
  if (!estado || estado.status !== t.ativo) return false;

  const user = store.users[proj.userId];
  const custo = t.custo();
  if (user && custo > 0) user.creditos += custo;

  proj[t.campo] = {
    status: 'interrompido',
    interrompidoEm: new Date().toISOString(),
    motivo,
    seivaEstornada: user ? custo : 0,
  };
  publicar('trabalho.interrompido', { projetoId: proj.id, tipo, estornado: user ? custo : 0 },
    { selo: 'VERIFICADO', userId: proj.userId });
  return true;
}

/**
 * Varredura de partida: nenhum trabalho sobrevive ao processo que o iniciou.
 * Roda uma vez, na subida do servidor, antes de aceitar requisição.
 */
export function varrerInterrompidos() {
  let encerrados = 0;
  let devolvido = 0;
  for (const proj of Object.values(store.projects || {})) {
    for (const tipo of Object.keys(TRABALHOS)) {
      const custo = TRABALHOS[tipo].custo();
      if (encerrar(proj, tipo, 'O servidor reiniciou durante o trabalho. A seiva foi devolvida.')) {
        encerrados += 1;
        devolvido += custo;
      }
    }
  }
  if (encerrados) {
    save();
    console.log(`retomada: ${encerrados} trabalho(s) interrompido(s) na queda anterior, ${devolvido} 🌿 devolvidos`);
  }
  return { encerrados, devolvido };
}
