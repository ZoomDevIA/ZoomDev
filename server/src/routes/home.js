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
export const MODULOS = [
  {
    id: 'carbono',
    nome: 'Calculadora de Carbono',
    emoji: '🍃',
    cor: '#00c8ff',
    chamada: 'Mede o passivo ambiental do negócio desde a primeira linha do plano.',
    aoLigar: {
      titulo: 'O que acontece ao ativar',
      corpo: 'Seu projeto passa a carregar um inventário de emissões pelos escopos 1, 2 e 3 do GHG Protocol. Os agentes incluem a pegada nas projeções financeiras, o Plano de Compensação é gerado junto com o plano de negócios e o CarbonPay fica disponível para compensar o residual.',
      ganhos: [
        'Inventário GHG Protocol com faixa de incerteza declarada',
        'Plano de compensação na hierarquia medir → reduzir → compensar',
        'Selo de evidência em cada número, sem estimativa disfarçada de dado',
      ],
      custo: 'Sem custo de seiva. Adiciona uma etapa de perguntas na ideação.',
    },
    aoDesligar: {
      titulo: 'O que você perde ao desligar',
      corpo: 'O projeto segue normalmente, mas sem inventário de emissões, sem plano de compensação e sem acesso ao CarbonPay a partir deste projeto. Você pode religar quando quiser: nada do que já foi calculado é apagado.',
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
      corpo: 'A jornada do projeto muda de trilha: entram os agentes da bioeconomia, o plano passa a exigir evidência científica classificada, o radar de editais prioriza fomento de bioeconomia e o Impacto 360° alinha o projeto aos ODS da ONU.',
      ganhos: [
        'Conselho com os especialistas de biotecnologia e regeneração',
        'Radar de editais focado em fomento de bioeconomia e clima',
        'Impacto 360° com alinhamento aos ODS e leitura ESG',
        'Selo de evidência exigido em toda afirmação científica',
      ],
      custo: 'Sem custo de seiva. A geração do plano fica mais criteriosa e um pouco mais lenta.',
    },
    aoDesligar: {
      titulo: 'O que você perde ao desligar',
      corpo: 'O projeto volta à trilha de startup digital: mais rápida, sem exigência de evidência científica e sem os módulos de bioeconomia. Continua com plano, MVP, editais e investidores.',
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
