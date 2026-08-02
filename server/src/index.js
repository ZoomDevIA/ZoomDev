// ZoomDev OS — API
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { register, login, authMiddleware, adminMiddleware, publicUser } from './auth.js';
import { save } from './store.js';
import { projectsRouter } from './routes/projects.js';
import { carbonRouter } from './routes/carbon.js';
import { platformRouter } from './routes/platform.js';
import { adminRouter } from './routes/admin.js';
import { impactoRouter } from './routes/impacto.js';
import { editaisRouter } from './routes/editais.js';
import { diagnosticoRouter } from './routes/diagnostico.js';
import { homeRouter } from './routes/home.js';
import { painelRouter } from './routes/painel.js';
import { elencoRouter } from './routes/elencoConselho.js';
import { pagamentosRouter } from './routes/pagamentos.js';
import { processarWebhookStripe } from './services/pagamentos.js';
import { migrarPicAgentes } from './protocols/migracao.js';
import { agendarPulso } from './services/pulsoDiario.js';
import { initPic } from './agents/sextaFeira.js';
import { nivelFundador, conquistasCatalogo, NIVEL_STARTUP } from './services/gamification.js';

const app = express();
app.use(cors());
// Webhook do Stripe exige o corpo BRUTO para validar a assinatura — por isso
// vem antes do parser JSON.
app.post('/api/pagamentos/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const r = await processarWebhookStripe(req.body, req.headers['stripe-signature']);
    res.json({ recebido: true, ...r });
  } catch (e) {
    console.error('webhook stripe:', e.message);
    res.status(e.status || 400).json({ error: e.message });
  }
});

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({
  ok: true,
  modo: config.hasApiKey ? `ia (${config.model})` : 'demo (sem ANTHROPIC_API_KEY)',
}));

app.use('/api', diagnosticoRouter);
// Home pública: a caixa de ideação, os módulos e a vitrine da comunidade
// carregam antes de qualquer login — é a porta de entrada do site.
app.use('/api', homeRouter);

app.get('/api/planos', (_req, res) => res.json(config.plans));

app.post('/api/auth/register', (req, res, next) => {
  try { res.json(register(req.body || {})); } catch (e) { next(e); }
});
app.post('/api/auth/login', (req, res, next) => {
  try { res.json(login(req.body || {})); } catch (e) { next(e); }
});

app.use('/api', authMiddleware);

app.get('/api/me', (req, res) => {
  // Último acesso com granularidade de hora: serve ao painel sem transformar
  // cada carregamento de página numa escrita em disco.
  const agora = new Date().toISOString();
  if (!req.user.ultimoAcesso || req.user.ultimoAcesso.slice(0, 13) !== agora.slice(0, 13)) {
    req.user.ultimoAcesso = agora;
    save();
  }
  const u = publicUser(req.user);
  res.json({
    ...u,
    nivel: nivelFundador(u.gamification.xp),
    catalogoConquistas: conquistasCatalogo(),
    niveisStartup: NIVEL_STARTUP,
  });
});

app.use('/api/projects', projectsRouter);
app.use('/api/carbon', carbonRouter);
app.use('/api/admin', adminMiddleware, adminRouter);
app.use('/api/painel', painelRouter);
app.use('/api/impacto', impactoRouter);
app.use('/api/editais', editaisRouter);
app.use('/api/pagamentos', pagamentosRouter);
app.use('/api', elencoRouter);
app.use('/api', platformRouter);

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.message || 'Erro interno.', code: err.code });
});

// ── Frontend compilado ────────────────────────────────────────────────────
// Se web/dist existir, o mesmo processo serve a aplicação: uma porta só, sem
// precisar do Vite. É o que torna `npm run preview` e o deploy triviais.
const distDir = new URL('../../web/dist/', import.meta.url).pathname;
if (fs.existsSync(path.join(distDir, 'index.html'))) {
  app.use(express.static(distDir));
  // SPA: qualquer rota que não seja /api cai no index.html
  app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(distDir, 'index.html')));
  console.log('Servindo o frontend compilado de web/dist');
}

// Protocolos: garante o PIC da Sexta-Feira e migra os PICs dos agentes se a
// versão base do código evoluiu (histórico preservado, rollback disponível).
initPic();
const migracao = migrarPicAgentes();
if (migracao) console.log(`PIC agentes: v${migracao.de} → v${migracao.para} (${migracao.total} agente(s) atualizado(s))`);

// Pulso diário: varredura de editais, matches, radar e alertas
agendarPulso();

process.on('SIGINT', () => { save(); process.exit(0); });

app.listen(config.port, () => {
  console.log(`ZoomDev OS API na porta ${config.port} — modo ${config.hasApiKey ? 'IA (' + config.model + ')' : 'DEMO'}`);
});
