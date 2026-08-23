// Rotas de paridade com o protótipo Base44: agentes, editais, análise IA rápida
// (analyzeStartup), notificações e chat do Zoom Intelligence.
import { Router } from 'express';
import { store, save } from '../store.js';
import { config } from '../config.js';
import { structured, conversar } from '../agents/claude.js';
import { AGENTES_GERAIS, AGENTES_BIO, NOTIFICACOES_SEED } from '../data/seeds.js';
import { nudgesDoDia, dispensarNudge, aceitarNudge } from '../services/agentBus.js';
import { agentesLegado } from '../services/elenco.js';
import { picNucleo } from '../protocols/picNucleo.js';
import { renderSystemPromptAgente } from '../protocols/picAgentes.js';

export const platformRouter = Router();

// Só agentes ATIVOS, agrupados por casta (núcleo internacional / amazônicos / operacionais)
platformRouter.get('/agents', (_req, res) => {
  res.json(agentesLegado());
});

platformRouter.get('/notificacoes', (_req, res) => {
  res.json(NOTIFICACOES_SEED);
});

// Editais e aderência migraram para routes/editais.js (radar diário + match explicável).

// Ações rápidas do dashboard (analyzeStartup do protótipo): market | financial | edital | competitor
const ANALISE_SCHEMA = {
  type: 'object',
  properties: {
    analise: { type: 'string' },
    recomendacoes: { type: 'array', items: { type: 'string' } },
    score: { type: 'integer' },
  },
  required: ['analise', 'recomendacoes', 'score'],
  additionalProperties: false,
};

const TIPOS_ANALISE = {
  market: 'Análise de Mercado: tamanho, tendências, timing e barreiras de entrada',
  financial: 'Análise Financeira: modelo de receita, unit economics, ponto de equilíbrio e necessidades de capital',
  edital: 'Busca de Editais: programas de fomento brasileiros compatíveis e estratégia de submissão',
  competitor: 'Análise Competitiva: concorrentes diretos/indiretos, posicionamento e diferenciais defensáveis',
};

function analiseDemo(tipo, nome) {
  const mapa = {
    market: { analise: `O mercado endereçado por ${nome} mostra sinais de digitalização acelerada e demanda reprimida em nichos desatendidos. O timing favorece entrantes ágeis com proposta clara.`, recomendacoes: ['Dimensione TAM/SAM/SOM com fontes públicas (IBGE, associações)', 'Entreviste 10 potenciais clientes antes de escalar', 'Monitore 3 concorrentes por 30 dias'], score: 7 },
    financial: { analise: `Para ${nome}, o modelo SaaS por assinatura tende ao melhor equilíbrio entre previsibilidade e velocidade de validação. Margem bruta estimada acima de 70% após escala.`, recomendacoes: ['Valide o preço com vendas reais, não pesquisas', 'Mantenha burn abaixo de R$ 15 mil/mês no primeiro ano', 'Busque subvenção (Centelha/FINEP) antes de equity'], score: 7 },
    edital: { analise: `Há janelas abertas de fomento compatíveis com ${nome}: Centelha 3 (ideação/MVP), FINEP Bioeconomia 2025 (se houver componente sustentável) e Sebrae Catalisa ICT.`, recomendacoes: ['Priorize editais com score de aderência > 75', 'Use o plano de negócios ZoomDev como base do formulário', 'Prepare certidões com antecedência'], score: 8 },
    competitor: { analise: `O cenário competitivo de ${nome} combina players estabelecidos caros e soluções improvisadas (planilhas). A janela está no meio: simplicidade + preço acessível.`, recomendacoes: ['Explore as fraquezas de UX dos líderes', 'Posicione-se por nicho, não por feature', 'Documente switching costs baixos como argumento de venda'], score: 7 },
  };
  return mapa[tipo];
}

platformRouter.post('/analyze', async (req, res, next) => {
  try {
    const { tipo, projetoId, nome, descricao } = req.body || {};
    if (!TIPOS_ANALISE[tipo]) return res.status(400).json({ error: 'Tipo de análise inválido.' });
    const proj = projetoId ? store.projects[projetoId] : null;
    const alvoNome = proj?.nome || nome || 'seu projeto';
    const alvoDesc = proj?.descricao || descricao || '';

    let resultado;
    if (!config.hasApiKey) {
      resultado = analiseDemo(tipo, alvoNome);
    } else {
      try {
        resultado = await structured({
          system: `Você é o Zoom Intelligence, IA da ZoomDev OS (startups + bioeconomia amazônica). Faça a análise pedida de forma objetiva e acionável, com score honesto de 0 a 10.`,
          user: `${TIPOS_ANALISE[tipo]}.\nProjeto: ${alvoNome}. Descrição: ${alvoDesc}`,
          schema: ANALISE_SCHEMA,
          effort: 'medium',
          maxTokens: 4000,
          modelo: config.modelos.gerado,
        });
      } catch (e) {
        if (e.code === 'REFUSAL') throw e;
        resultado = analiseDemo(tipo, alvoNome);
      }
    }
    res.json({ tipo, titulo: TIPOS_ANALISE[tipo].split(':')[0], ...resultado });
  } catch (e) { next(e); }
});

// Zoom Intelligence: chat do copiloto (histórico vem do cliente; persiste últimas 50 msgs)
platformRouter.post('/chat', async (req, res, next) => {
  try {
    const { mensagens = [] } = req.body || {};
    const historico = mensagens.slice(-12).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || '').slice(0, 4000),
    }));
    if (!historico.length || historico[historico.length - 1].role !== 'user') {
      return res.status(400).json({ error: 'Envie a mensagem do usuário.' });
    }

    const projetos = Object.values(store.projects).filter(p => p.userId === req.user.id);
    const picMaia = picNucleo('maia');
    const system = `${picMaia ? renderSystemPromptAgente(picMaia) : 'Você é a Maiá, Inteligência Regenerativa da ZoomDev OS.'}

Responda de forma objetiva, acionável e use markdown quando útil. Responda sempre em pt-BR.
Contexto do usuário: ${projetos.length} projeto(s)${projetos[0] ? `, mais recente: "${projetos[0].nome}" (${projetos[0].classificacao}, fase ${projetos[0].fase})` : ''}. Créditos (seiva): ${req.user.creditos}.
A plataforma tem: geração de plano de negócios pelos 5 agentes, jornada gamificada (Ideação→Validação→MVP→Tração→Escala), calculadora de passivo ambiental (GHG Protocol) e CarbonPay para compensação com créditos verificados.`;

    let resposta;
    if (!config.hasApiKey) {
      const ultima = historico[historico.length - 1].content.toLowerCase();
      resposta = ultima.includes('edital')
        ? 'No modo demo respondo de forma limitada 😉, mas veja a aba **Editais**: FINEP Bioeconomia 2025 (R$ 200 mi) e nexBio Amazônia 2026 (R$ 107 mi) estão abertos, e o botão "IA Calcular Aderência" mostra o encaixe do seu projeto.'
        : ultima.includes('carbono') || ultima.includes('carbon')
          ? 'Use a **Calculadora de Passivo Ambiental** (CarbonPay) para estimar sua pegada pelos escopos 1, 2 e 3 do GHG Protocol e compensar com créditos verificados. Calcular dá XP e a conquista Guardião da Floresta 🌳'
          : 'Estou em modo demo (sem API key), mas o caminho é esse: descreva sua ideia em **Nova Ideia**, gere o plano com os 5 agentes e siga as missões de validação que o próprio plano cria. Configure a ANTHROPIC_API_KEY para conversas completas comigo. 🚀';
    } else {
      resposta = await conversar({ system, messages: historico, effort: 'medium', maxTokens: 3000, modelo: config.modelos.gerado });
    }

    // Persistência leve do chat (ChatLog do protótipo)
    req.user.chatLog = [...(req.user.chatLog || []), historico[historico.length - 1], { role: 'assistant', content: resposta }].slice(-50);
    save();
    res.json({ resposta });
  } catch (e) { next(e); }
});

platformRouter.get('/chat', (req, res) => {
  res.json(req.user.chatLog || []);
});

// ── Agent Bus: nudges preditivos gamificados (orquestrados pela Sexta-Feira) ──
platformRouter.get('/nudges', (req, res) => {
  res.json(nudgesDoDia(req.user));
});

platformRouter.post('/nudges/:id/dispensar', (req, res) => {
  if (!dispensarNudge(req.user, req.params.id)) return res.status(404).json({ error: 'Nudge não encontrado.' });
  res.json({ ok: true });
});

platformRouter.post('/nudges/:id/aceitar', (req, res) => {
  if (!aceitarNudge(req.user, req.params.id)) return res.status(404).json({ error: 'Nudge não encontrado.' });
  res.json({ ok: true });
});
