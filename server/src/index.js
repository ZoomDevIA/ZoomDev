// ZoomDev OS — API
import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { register, login, authMiddleware, adminMiddleware, publicUser } from './auth.js';
import { save } from './store.js';
import { projectsRouter } from './routes/projects.js';
import { carbonRouter } from './routes/carbon.js';
import { platformRouter } from './routes/platform.js';
import { adminRouter } from './routes/admin.js';
import { initPic } from './agents/sextaFeira.js';
import { nivelFundador, conquistasCatalogo, NIVEL_STARTUP } from './services/gamification.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({
  ok: true,
  modo: config.hasApiKey ? `ia (${config.model})` : 'demo (sem ANTHROPIC_API_KEY)',
}));

app.get('/api/planos', (_req, res) => res.json(config.plans));

app.post('/api/auth/register', (req, res, next) => {
  try { res.json(register(req.body || {})); } catch (e) { next(e); }
});
app.post('/api/auth/login', (req, res, next) => {
  try { res.json(login(req.body || {})); } catch (e) { next(e); }
});

app.use('/api', authMiddleware);

app.get('/api/me', (req, res) => {
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
app.use('/api', platformRouter);

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.message || 'Erro interno.', code: err.code });
});

// Garante o PIC fundador da Sexta-Feira no primeiro boot
initPic();

process.on('SIGINT', () => { save(); process.exit(0); });

app.listen(config.port, () => {
  console.log(`ZoomDev OS API na porta ${config.port} — modo ${config.hasApiKey ? 'IA (' + config.model + ')' : 'DEMO'}`);
});
