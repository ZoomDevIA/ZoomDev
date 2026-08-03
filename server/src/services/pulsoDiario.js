// ═══════════════════════════════════════════════════════════════════════════
// PULSO DIÁRIO: o batimento cardíaco da plataforma
//
// Uma vez por dia (e no boot, se atrasado), a Sexta-Feira: varre editais,
// recalcula os matches de todos os projetos, atualiza o Radar Unicórnio,
// regenera nudges e publica notificações do que mudou.
//
// A plataforma deixa de ser reativa: ela trabalha enquanto o fundador dorme.
// ═══════════════════════════════════════════════════════════════════════════
import { store, save, id } from '../store.js';
import { expurgarAnexosVencidos } from './lgpd.js';
import { limparSessoesVencidas } from '../auth.js';
import { varrer, matchesDoProjeto, resumoRadar } from './radarEditais.js';
import { radarProjeto } from './unicornio.js';

const DIA_MS = 86400000;

export function estadoPulso() {
  if (!store.pulso) {
    store.pulso = { ultimoPulso: null, historico: [], alertas: {} };
    save();
  }
  return store.pulso;
}

function alertasDoUsuario(userId) {
  const p = estadoPulso();
  if (!p.alertas[userId]) p.alertas[userId] = [];
  return p.alertas[userId];
}

/** Executa o pulso completo. Idempotente por dia, salvo `forcar`. */
export async function pulsar({ forcar = false } = {}) {
  const p = estadoPulso();
  const agora = new Date().toISOString();

  if (!forcar && p.ultimoPulso && Date.now() - new Date(p.ultimoPulso).getTime() < DIA_MS) {
    return { pulado: true, ultimoPulso: p.ultimoPulso };
  }

  // 0. Higiene de dados: prazos de retenção e sessões vencidas.
  //
  // Fica no pulso porque uma varredura por dia é exatamente a granularidade
  // certa para prazo medido em meses, e porque um processo separado só para
  // isso seria mais infraestrutura para manter do que valor entregue.
  const anexosExpurgados = expurgarAnexosVencidos();
  const sessoesEncerradas = limparSessoesVencidas();
  if (anexosExpurgados || sessoesEncerradas) {
    console.log(`higiene: ${anexosExpurgados} anexo(s) expurgado(s), ${sessoesEncerradas} sessão(ões) vencida(s)`);
  }

  // 1. Varredura de editais
  const varredura = await varrer({ forcar });

  // 2. Recalcula matches e detecta novidades por projeto
  const projetos = Object.values(store.projects);
  let novosMatches = 0, projetosAvaliados = 0;

  for (const proj of projetos) {
    const matches = matchesDoProjeto(proj, 60);
    const anteriores = new Set(proj.matchesEditais?.map(m => m.editalId) || []);
    const novos = matches.filter(m => !anteriores.has(m.editalId));

    proj.matchesEditais = matches.slice(0, 10).map(m => ({
      editalId: m.editalId, edital: m.edital, score: m.score, dias: m.dias, tier: m.tier,
    }));
    proj.radar = radarProjeto(proj, store.users[proj.userId]);
    projetosAvaliados++;

    for (const m of novos) {
      novosMatches++;
      alertasDoUsuario(proj.userId).unshift({
        id: id('alt'), em: agora, tipo: 'novo_match',
        titulo: `${m.edital} combina com ${proj.nome}`,
        detalhe: `Aderência de ${m.score}/100${m.dias !== null ? ` · fecha em ${m.dias} dias` : ''}. ${m.sinais[0]?.motivo || ''}`,
        rota: '/editais', projetoId: proj.id, editalId: m.editalId, lido: false,
      });
    }

    // Alerta de prazo curto para matches fortes
    for (const m of matches) {
      if (m.dias !== null && m.dias <= 15 && m.score >= 70) {
        const chave = `prazo:${m.editalId}:${proj.id}`;
        const jaAlertado = alertasDoUsuario(proj.userId).some(a => a.chave === chave);
        if (!jaAlertado) {
          alertasDoUsuario(proj.userId).unshift({
            id: id('alt'), chave, em: agora, tipo: 'prazo',
            titulo: `⏳ ${m.dias} dias: ${m.edital}`,
            detalhe: `Aderência ${m.score}/100 com ${proj.nome}. Submissões preparadas com antecedência têm o dobro de aprovação.`,
            rota: '/editais', projetoId: proj.id, editalId: m.editalId, lido: false,
          });
        }
      }
    }
  }

  // Limita o histórico de alertas por usuário
  for (const uid of Object.keys(p.alertas)) p.alertas[uid] = p.alertas[uid].slice(0, 40);

  p.ultimoPulso = agora;
  p.historico.unshift({ em: agora, projetosAvaliados, novosMatches, editaisNovos: varredura.novos || 0, modo: varredura.modo });
  p.historico = p.historico.slice(0, 30);
  save();

  return { pulado: false, em: agora, projetosAvaliados, novosMatches, varredura, radar: resumoRadar() };
}

export function alertas(userId, { apenasNaoLidos = false } = {}) {
  const lista = alertasDoUsuario(userId);
  return apenasNaoLidos ? lista.filter(a => !a.lido) : lista;
}

export function marcarAlertaLido(userId, alertaId) {
  const a = alertasDoUsuario(userId).find(x => x.id === alertaId);
  if (!a) return false;
  a.lido = true;
  save();
  return true;
}

export function resumoPulso() {
  const p = estadoPulso();
  return {
    ultimoPulso: p.ultimoPulso,
    proximoPulso: p.ultimoPulso ? new Date(new Date(p.ultimoPulso).getTime() + DIA_MS).toISOString() : 'no próximo boot',
    historico: p.historico.slice(0, 10),
    radar: resumoRadar(),
  };
}

/** Agenda o pulso: dispara no boot (se atrasado) e a cada 6h verifica a janela. */
export function agendarPulso() {
  const rodar = () => {
    pulsar().catch(e => console.error('pulso: falha', e.message));
  };
  setTimeout(rodar, 5000).unref?.();
  const t = setInterval(rodar, 6 * 3600 * 1000);
  t.unref?.();
  return t;
}
