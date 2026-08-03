// ═══════════════════════════════════════════════════════════════════════════
// ROTAS PÚBLICAS DA HOME: servem a porta de entrada da plataforma.
//
// Ficam antes do authMiddleware de propósito: quem chega sem conta vê a caixa
// de ideação, os módulos e a vitrine da comunidade, e só é levado ao cadastro
// quando decide construir.
// ═══════════════════════════════════════════════════════════════════════════
import { Router } from 'express';
import { listarVitrine, estatisticasPublicas } from '../services/vitrine.js';
import { config } from '../config.js';

export const homeRouter = Router();

// ── Os dois seletores da home ──────────────────────────────────────────────
// O texto de cada módulo mora aqui para que a caixa de contexto que aparece
// antes de ligar o botão e o que o módulo realmente faz nunca se separem.
//
// O corpo é curto de propósito: ele aparece numa caixa flutuante sobre a
// página, e um parágrafo de cinco linhas ali vira um bloco que atrapalha em
// vez de informar. O detalhe fica nos ganhos, que são lidos em varredura.
export const MODULOS = [
  {
    id: 'carbono',
    nome: 'Calculadora de Carbono',
    emoji: '🍃',
    cor: '#00c8ff',
    chamada: 'Mede o passivo ambiental do negócio desde a primeira linha do plano.',
    aoLigar: {
      titulo: 'O que acontece ao ativar',
      corpo: 'O plano passa a carregar o inventário de emissões pelos escopos 1, 2 e 3 do GHG Protocol, e nasce com o Plano de Compensação junto.',
      ganhos: [
        'Pegada dentro das projeções financeiras',
        'Compensação na hierarquia medir, reduzir, compensar',
        'Selo de evidência em cada número',
      ],
      custo: 'Sem custo de seiva. Acrescenta uma etapa de perguntas na ideação.',
    },
    aoDesligar: {
      titulo: 'O que você perde ao desligar',
      corpo: 'O projeto segue sem inventário, sem plano de compensação e sem CarbonPay. Religar depois não apaga nada do que já foi calculado.',
    },
  },
  {
    id: 'bio',
    nome: 'BioStartups',
    emoji: '🌿',
    cor: '#00ff64',
    chamada: 'Troca a jornada genérica pela trilha da bioeconomia regenerativa.',
    aoLigar: {
      titulo: 'O que acontece ao ativar',
      corpo: 'A jornada troca de trilha: entram os agentes da bioeconomia e toda afirmação científica passa a exigir evidência classificada.',
      ganhos: [
        'Conselho de biotecnologia e regeneração',
        'Editais de fomento de bioeconomia e clima',
        'Impacto 360° alinhado aos ODS da ONU',
      ],
      custo: 'Sem custo de seiva. O plano fica mais criterioso e um pouco mais lento.',
    },
    aoDesligar: {
      titulo: 'O que você perde ao desligar',
      corpo: 'O projeto volta à trilha de startup digital, mais rápida e sem exigência científica. Continua com plano, MVP, editais e investidores.',
    },
  },
];

homeRouter.get('/home', (req, res) => {
  res.json({
    modulos: MODULOS,
    stats: estatisticasPublicas(),
    vitrine: listarVitrine({ limite: 12, filtro: req.query.filtro || 'todos' }),
  });
});

homeRouter.get('/home/vitrine', (req, res) => {
  res.json(listarVitrine({ filtro: req.query.filtro || 'todos', limite: req.query.limite }));
});

// ── Tabela de custos ───────────────────────────────────────────────────────
// Pública e sem segredo nenhum: o preço em seiva de cada operação sai daqui
// para a interface. Escrever o número à mão no frontend garantiria que ele
// ficasse desatualizado na primeira recalibragem.
homeRouter.get('/custos', (_req, res) => {
  const c = config.credits;
  res.json({
    planoNegocios: c.planGeneration,
    mvp: c.mvpBuild,
    revisaoDocumento: c.documentoRevisao,
    conversaStudio: c.studioTurno,
    transcricao: c.transcricao,
    gratuitos: ['classificação da ideia', 'leitura antecipada da caixa de contexto'],
    creditosIniciais: c.initial,
  });
});
