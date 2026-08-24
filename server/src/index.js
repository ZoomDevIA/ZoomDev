// ZoomDev OS: API
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { config } from './config.js';
import { cabecalhos, cors, dominios, POLITICA_PREVIA, POLITICA_SITE } from './services/blindagem.js';
import { lerPrevia, montarPrevia } from './services/previa.js';
import { migrarConteudo } from './services/conteudo.js';
import { siteDoSlug, montarPagina, registrarLead, registrarVisita, paginaObrigado, esc as escaparHtml, PREFIXO } from './services/publicacao.js';
import { register, login, loginComGoogle, authMiddleware, adminMiddleware, publicUser, rotularAparelho } from './auth.js';
import { modoLoginGoogle, clientIdGoogle, verificarCredencialGoogle } from './services/loginGoogle.js';
import { save, store, salvarAgoraSePendente } from './store.js';
import { projectsRouter } from './routes/projects.js';
import { carbonRouter } from './routes/carbon.js';
import { platformRouter } from './routes/platform.js';
import { adminRouter } from './routes/admin.js';
import { impactoRouter } from './routes/impacto.js';
import { editaisRouter } from './routes/editais.js';
import { isometricRouter } from './routes/isometric.js';
import { territorioRouter } from './routes/territorio.js';
import { passaporteRouter } from './routes/passaporte.js';
import { diagnosticoRouter } from './routes/diagnostico.js';
import { homeRouter } from './routes/home.js';
import { painelRouter } from './routes/painel.js';
import { contaRouter } from './routes/conta.js';
import { destravarNaPartida } from './services/recuperacaoSenha.js';
import { varrerInterrompidos } from './services/retomada.js';
import { studioRouter } from './routes/studio.js';
import { pedirRedefinicao, redefinir } from './services/recuperacaoSenha.js';
import { limitar } from './services/limite.js';
import { agendarBackup } from './services/backup.js';
import { registrarAceiteTermos, VERSAO_TERMOS } from './services/lgpd.js';
import { modoEmail } from './services/email.js';
import { elencoRouter } from './routes/elencoConselho.js';
import { pagamentosRouter } from './routes/pagamentos.js';
import { processarWebhookStripe } from './services/pagamentos.js';
import { migrarPicAgentes } from './protocols/migracao.js';
import { agendarPulso } from './services/pulsoDiario.js';
import { initPic } from './agents/sextaFeira.js';
import { nivelFundador, conquistasCatalogo, NIVEL_STARTUP } from './services/gamification.js';

const app = express();
app.disable('x-powered-by');

// Antes de tudo: quem chegou pelo domínio errado é redirecionado antes de
// qualquer resposta ganhar corpo (apex do app para o www; .io para o site).
app.use(dominios);

// Cabeçalhos de segurança em toda resposta, inclusive nos sites publicados.
app.use(cabecalhos);

// A política de origem protege a API, e SÓ a API.
//
// Aplicada globalmente, ela quebrava os sites publicados pelos fundadores:
// eles rodam em origem opaca por causa do `sandbox`, e o navegador manda
// `Origin: null` no envio do formulário. O middleware via uma origem estranha
// e devolvia 403, então nenhum contato entrava. Um site na internet não é
// chamada de API, e a política de origem não tem o que dizer sobre ele.
app.use('/api', cors);

// ── Prévia do MVP ──────────────────────────────────────────────────────────
// Fora de /api e antes da autenticação de propósito: o iframe não carrega
// cabeçalho de autorização, então o acesso vem de um bilhete de dez minutos
// emitido por quem já está autenticado. O documento sai com política própria,
// em origem opaca, sem alcance ao armazenamento nem ao token da plataforma.
app.get('/previa/:bilhete', (req, res) => {
  // Os cabeçalhos vêm antes do desvio: a mensagem de prévia expirada também
  // precisa aparecer dentro do iframe, e com DENY ela ficaria em branco.
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Security-Policy', POLITICA_PREVIA);
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Cache-Control', 'no-store');

  const p = lerPrevia(req.params.bilhete);
  if (!p) {
    return res.status(410).send(
      '<!doctype html><meta charset="utf-8">'
      + '<body style="font:14px system-ui;background:#0b1f16;color:#9fb8ad;padding:28px">'
      + 'Esta prévia expirou. Use o botão de recarregar no Estúdio.');
  }
  res.send(montarPrevia(p.arquivos, p.pagina));
});
// Webhook do Stripe exige o corpo BRUTO para validar a assinatura, por isso
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

// ═══════════════════════════════════════════════════════════════════════════
// SITES PUBLICADOS PELOS FUNDADORES
//
// Público, fora de /api e antes da autenticação: é um site na internet, aberto
// a quem receber o link. A política de conteúdo é própria e começa com
// `sandbox`, o que joga o documento numa origem opaca: código gerado por IA
// não alcança o armazenamento da plataforma nem o token de quem estiver
// logado na mesma aba.
//
// O formulário chega aqui por POST de formulário comum, não por fetch. Em
// origem opaca um fetch seria requisição de outra origem e esbarraria em CORS;
// o envio nativo funciona, e ainda funciona com o JavaScript desligado.
// ═══════════════════════════════════════════════════════════════════════════
const formulario = express.urlencoded({ extended: false, limit: '64kb' });

app.post(`${PREFIXO}/:slug/lead`,
  limitar({ max: 20, janelaSeg: 3600, mensagem: 'Muitos envios deste endereço. Tente mais tarde.' }),
  formulario,
  async (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Security-Policy', POLITICA_SITE);
    try {
      const site = siteDoSlug(req.params.slug);
      await registrarLead(req.params.slug, req.body, { ip: req.ip });
      res.send(paginaObrigado(site?.proj?.nome));
    } catch (e) {
      // Duas coisas erradas moravam nesta linha: a mensagem interna ia para a
      // página pública, e ia sem escape, dentro de HTML montado à mão. Agora o
      // visitante recebe o recado dele quando o erro é dele (4xx) e uma frase
      // neutra quando o erro é nosso, sempre escapado.
      const status = e.status || 500;
      const recado = status < 500
        ? String(e.message || '').slice(0, 160)
        : 'Tivemos um problema para registrar seu contato. Tente de novo em instantes.';
      if (status >= 500) console.error('[lead]', e);
      res.status(status).send(
        '<!doctype html><meta charset="utf-8">'
        + '<body style="font:15px system-ui;background:#06140d;color:#dff6ec;padding:32px">'
        + escaparHtml(recado));
    }
  });

app.get(`${PREFIXO}/:slug/:pagina?`, (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Security-Policy', POLITICA_SITE);
  res.setHeader('X-Frame-Options', 'DENY');

  const site = siteDoSlug(req.params.slug);
  if (!site) {
    return res.status(404).send(
      '<!doctype html><meta charset="utf-8"><title>Site não encontrado</title>'
      + '<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;'
      + 'background:#06140d;color:#9fb8ad;font:16px system-ui;padding:24px;text-align:center">'
      + '<div>Este endereço não está publicado.<br><span style="font-size:12px;opacity:.6">ZoomDev OS</span></div>');
  }

  const pagina = req.params.pagina || 'index.html';
  if (!/^[A-Za-z0-9._-]+\.html?$/.test(pagina)) return res.status(404).send('Página não encontrada.');

  const html = montarPagina(site.arquivos, pagina, req.params.slug);
  if (!html) return res.status(404).send('Página não encontrada.');

  registrarVisita(site.proj);
  res.send(html);
});

// O corpo grande do Studio é lido ANTES do parser geral. Sem esta linha, o
// `express.json({ limit: '12mb' })` que o roteador do Studio declara nunca
// executava: o parser global já tinha marcado a requisição como lida, e o
// documento do ZoomDoc com imagem embutida passava a falhar com 413 a cada
// salvamento automático, perdendo o trabalho em silêncio.
app.use('/api/studio', express.json({ limit: '12mb' }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({
  ok: true,
  modo: config.hasApiKey ? `ia (${config.model})` : 'demo (sem ANTHROPIC_API_KEY)',
}));

app.use('/api', diagnosticoRouter);
// Home pública: a caixa de ideação, os módulos e a vitrine da comunidade
// carregam antes de qualquer login: é a porta de entrada do site.
app.use('/api', homeRouter);
// Passaporte público do hectare: quem escaneia o QR não tem conta, e o
// propósito é exatamente esse. Só leitura, sem nenhum dado de pessoa.
app.use('/api', passaporteRouter);

app.get('/api/planos', (_req, res) => res.json(config.plans));

// Cadastro e login com freio: sem isso, as duas rotas aceitam tentativa
// infinita e viram porta de força bruta e de criação de contas em massa.
app.post('/api/auth/register',
  limitar({ max: 5, janelaSeg: 3600, mensagem: 'Muitas contas criadas deste endereço. Tente mais tarde.' }),
  (req, res, next) => {
    try {
      const r = register(req.body || {}, rotularAparelho(req.headers['user-agent']));
      // Aceite dos termos gravado com a versão vigente no momento do cadastro.
      registrarAceiteTermos(store.users[r.user.id]);
      res.json({ ...r, user: { ...r.user, termosAceitos: store.users[r.user.id].termosAceitos } });
    } catch (e) { next(e); }
  });

app.post('/api/auth/login',
  limitar({ max: 8, janelaSeg: 600, mensagem: 'Muitas tentativas de login. Aguarde alguns minutos.' }),
  (req, res, next) => {
    try { res.json(login(req.body || {}, rotularAparelho(req.headers['user-agent']))); } catch (e) { next(e); }
  });

// ── Login com Google ───────────────────────────────────────────────────────
// A tela pergunta primeiro se o recurso existe: sem GOOGLE_CLIENT_ID o botão
// nem aparece, em vez de aparecer e falhar. O client_id é público por
// definição no fluxo de ID token, então expô-lo aqui não revela nada.
app.get('/api/auth/google/config', (_req, res) => {
  res.json({ ativo: modoLoginGoogle() === 'ativo', clientId: clientIdGoogle() });
});

app.post('/api/auth/google',
  limitar({ max: 10, janelaSeg: 600, mensagem: 'Muitas tentativas de login. Aguarde alguns minutos.' }),
  async (req, res, next) => {
    try {
      const identidade = await verificarCredencialGoogle(req.body?.credential);
      const r = loginComGoogle(identidade, rotularAparelho(req.headers['user-agent']));
      // Conta recém-criada pelo Google aceita os termos no mesmo ato, como no
      // cadastro por senha: a versão vigente fica registrada com data.
      if (!store.users[r.user.id].termosAceitos) registrarAceiteTermos(store.users[r.user.id]);
      res.json({ ...r, user: { ...r.user, termosAceitos: store.users[r.user.id].termosAceitos } });
    } catch (e) { next(e); }
  });

// ── Recuperação de senha (pública: quem esqueceu não consegue autenticar) ──
app.post('/api/auth/recuperar',
  limitar({ max: 5, janelaSeg: 900, mensagem: 'Muitos pedidos de recuperação. Aguarde 15 minutos.' }),
  async (req, res, next) => {
    try { res.json(await pedirRedefinicao(req.body?.email)); } catch (e) { next(e); }
  });

app.post('/api/auth/redefinir',
  limitar({ max: 10, janelaSeg: 900, campo: 'token', mensagem: 'Muitas tentativas. Aguarde.' }),
  async (req, res, next) => {
    try { res.json(await redefinir(req.body || {})); } catch (e) { next(e); }
  });

app.get('/api/termos-versao', (_req, res) => res.json({
  versao: VERSAO_TERMOS,
  emailConfigurado: modoEmail() !== 'registro',
}));

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
app.use('/api/conta', contaRouter);
app.use('/api/studio', studioRouter);
app.use('/api/impacto', impactoRouter);
app.use('/api/editais', editaisRouter);
app.use('/api', territorioRouter);
app.use('/api/isometric', isometricRouter);
app.use('/api/pagamentos', pagamentosRouter);
app.use('/api', elencoRouter);
app.use('/api', platformRouter);

// Rota de API que não existe responde JSON, e não a página "Cannot GET" do
// Express. O cliente sempre faz JSON.parse na resposta: sem isto, um endereço
// digitado errado vira erro de sintaxe no navegador em vez de "não encontrada",
// e quem estiver depurando perde tempo procurando defeito onde não tem.
app.use('/api', (req, res) => {
  res.status(404).json({ error: `Rota não encontrada: ${req.method} ${req.baseUrl}${req.path}` });
});

// Erro de 4xx é conversa com o usuário: a mensagem foi escrita para ele ler e
// vai inteira. Erro de 5xx é defeito nosso, e a mensagem foi escrita para o
// log: caminho de arquivo, corpo de resposta de terceiro, nome de variável.
// Nada disso ajuda quem está do outro lado, e parte disso é mapa da casa para
// quem procura brecha. Sai uma frase útil e um código curto de referência; o
// texto real fica no log, indexado pelo mesmo código.
//
// A exceção é o 5xx marcado com `publico: true`: são os "não configurado"
// escritos de propósito para quem opera a instalação (falta a chave da IA,
// falta o GOOGLE_CLIENT_ID). Esses dizem exatamente o que fazer e não contêm
// nada de dentro.
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  if (status < 500 || err.publico) {
    return res.status(status).json({ error: err.message || 'Requisição inválida.', code: err.code });
  }
  const ref = Math.random().toString(36).slice(2, 8).toUpperCase();
  console.error(`[erro ${ref}]`, err);
  res.status(status).json({
    error: 'Algo quebrou do nosso lado. Tente de novo em instantes; se insistir, informe o código abaixo ao suporte.',
    code: err.code || 'ERRO_INTERNO',
    ref,
  });
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

// Conteúdo pesado fora do índice: move documento, código do MVP, anexos e
// trilha do db.json para um arquivo por projeto. Roda uma vez; projeto já
// migrado não entra na conta.
migrarConteudo();

// Protocolos: garante o PIC da Sexta-Feira e migra os PICs dos agentes se a
// versão base do código evoluiu (histórico preservado, rollback disponível).
initPic();
const migracao = migrarPicAgentes();
if (migracao) console.log(`PIC agentes: v${migracao.de} → v${migracao.para} (${migracao.total} agente(s) atualizado(s))`);

// Pulso diário: varredura de editais, matches, radar e alertas
agendarPulso();

// Cópias rotativas do banco dentro do volume: o volume protege contra a troca
// de imagem no deploy, não contra escrita corrompida ou exclusão acidental.
agendarBackup();

// Encerramento: gravar AGORA o que estava agendado, e cobrir o SIGTERM, que
// é o sinal que a hospedagem manda em todo deploy. O SIGINT sozinho protegia
// só o Ctrl-C do desenvolvedor.
const encerrar = (sinal) => () => {
  salvarAgoraSePendente();
  console.log(`ZoomDev OS encerrando (${sinal}): estado gravado.`);
  process.exit(0);
};
process.on('SIGINT', encerrar('SIGINT'));
process.on('SIGTERM', encerrar('SIGTERM'));

// Exportado para o teste de rota poder subir a aplicação de verdade, ler a
// porta que o sistema deu e fechar no fim. Com PORT=0 o sistema escolhe uma
// porta livre, então o teste roda mesmo com a plataforma já no ar na 4000.
export const servidor = app.listen(config.port, async () => {
  console.log(`ZoomDev OS API na porta ${config.port}: modo ${config.hasApiKey ? 'IA (' + config.model + ')' : 'DEMO'}`);
  // Destravamento de emergência: só faz alguma coisa se ZOOMDEV_RECUPERAR
  // estiver definida. Imprime um link de uso único no log e nada mais.
  await destravarNaPartida().catch(e => console.error('ZOOMDEV_RECUPERAR falhou:', e.message));
  // Nenhum trabalho longo sobrevive ao processo que o iniciou: o que ficou
  // pendurado numa queda anterior é encerrado e a seiva volta para quem pagou.
  varrerInterrompidos();
});
