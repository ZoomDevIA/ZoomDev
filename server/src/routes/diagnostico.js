// ═══════════════════════════════════════════════════════════════════════════
// DIAGNÓSTICO DE IMPLANTAÇÃO: /api/status
//
// Endpoint público que responde "está tudo certo?" depois de um deploy.
// NUNCA expõe segredo: só informa se a variável está definida, o formato
// aparente e uma dica mascarada quando ajuda a identificar erro de digitação.
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import { config } from '../config.js';
import { store } from '../store.js';
import { pagamentosConfig } from '../services/pagamentos.js';
import { CATALOGO } from '../services/elenco.js';
import { origensPermitidas } from '../services/blindagem.js';
import { isAdmin, quemPede } from '../auth.js';
import { testarSupabase } from '../services/supabase.js';

export const diagnosticoRouter = Router();

// Chave real da Anthropic fica na casa dos 100+ caracteres. O corte em 40 é
// generoso de propósito: pega o valor truncado sem depender do formato exato.
const COMPRIMENTO_MINIMO_CHAVE = 40;

// ═══════════════════════════════════════════════════════════════════════════
// TESTE REAL DA CHAVE: /api/status?testar=ia
//
// Formato certo não é o mesmo que chave válida: só uma chamada de verdade
// distingue "colei errado" de "a conta está sem crédito". O teste gasta um
// punhado de tokens, então o resultado fica em cache por 5 minutos: a rota é
// pública e não pode virar torneira de custo.
// ═══════════════════════════════════════════════════════════════════════════
const CACHE_TESTE_MS = 5 * 60 * 1000;
let ultimoTeste = null;   // { em, resultado }

async function testarChave() {
  if (ultimoTeste && Date.now() - ultimoTeste.em < CACHE_TESTE_MS) {
    return { ...ultimoTeste.resultado, cache: true, testadoEm: new Date(ultimoTeste.em).toISOString() };
  }
  let resultado;
  if (!config.hasApiKey) {
    resultado = { ok: false, situacao: 'sem_chave', mensagem: 'ANTHROPIC_API_KEY não está definida neste processo.' };
  } else {
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const r = await new Anthropic().messages.create({
        model: config.model,
        max_tokens: 4,
        messages: [{ role: 'user', content: 'ok' }],
      });
      resultado = {
        ok: true,
        situacao: 'valida',
        mensagem: `A chave respondeu. Modelo ${r.model}. A plataforma está em modo IA de verdade.`,
        modelo: r.model,
      };
    } catch (e) {
      const status = e?.status || e?.response?.status || null;
      const porStatus = {
        401: ['chave_invalida', 'A Anthropic recusou a chave (401). Ela foi revogada, está incompleta ou pertence a outra organização. Gere uma nova em console.anthropic.com → API Keys.'],
        403: ['sem_permissao', 'A chave existe mas não tem permissão para este modelo (403). Confira o workspace da chave.'],
        404: ['modelo_desconhecido', `O modelo "${config.model}" não foi encontrado (404). Ajuste a variável ZOOMDEV_MODEL.`],
        429: ['sem_credito', 'Chave válida, mas a conta está sem crédito ou atingiu o limite de uso (429). Adicione crédito em console.anthropic.com → Billing.'],
      };
      const [situacao, mensagem] = porStatus[status] || ['erro', `Falha ao falar com a Anthropic: ${e.message}`];
      resultado = { ok: false, situacao, mensagem, status };
    }
  }
  ultimoTeste = { em: Date.now(), resultado };
  return { ...resultado, cache: false, testadoEm: new Date().toISOString() };
}

/** Mostra só o suficiente para conferir sem vazar o valor. */
function pista(valor, { inicio = 0, fim = 4 } = {}) {
  if (!valor) return null;
  const s = String(valor);
  if (s.length <= inicio + fim) return '•'.repeat(s.length);
  return `${s.slice(0, inicio)}${'•'.repeat(Math.max(4, s.length - inicio - fim))}${s.slice(-fim)}`;
}

function verificarDisco() {
  const dir = config.dataDir;
  const resultado = { caminho: dir, existe: false, gravavel: false, persistente: null, bytes: 0 };
  try {
    fs.mkdirSync(dir, { recursive: true });
    resultado.existe = true;
    const teste = path.join(dir, '.escrita-teste');
    fs.writeFileSync(teste, 'ok');
    fs.unlinkSync(teste);
    resultado.gravavel = true;
    const db = path.join(dir, 'db.json');
    if (fs.existsSync(db)) resultado.bytes = fs.statSync(db).size;
    // Heurística: dentro da imagem (/app/...) sem volume, os dados somem no deploy.
    // Um volume montado normalmente aparece como ponto de montagem próprio.
    resultado.persistente = process.env.RAILWAY_VOLUME_MOUNT_PATH
      ? path.resolve(dir).startsWith(path.resolve(process.env.RAILWAY_VOLUME_MOUNT_PATH))
      : null;
  } catch (e) {
    resultado.erro = e.message;
  }
  return resultado;
}

// ── Quanto o diagnóstico conta, e para quem ────────────────────────────────
//
// Esta rota é pública de propósito: ela existe para o operador conferir a
// instalação ANTES de ter conta. Só que ela contava demais para quem não é
// operador nenhum: e-mail do administrador quase inteiro, prefixo e tamanho
// das chaves, se o pagamento estava em modo simulado, nome do ambiente,
// caminho do volume e a contagem de usuários. Era um mapa de alvos.
//
// Agora o detalhe fica atrás do administrador; o público vê o suficiente para
// saber se a plataforma está de pé e o que falta configurar, sem pistas.
const CHAVES_SENSIVEIS = new Set(['ia', 'admin', 'stripe', 'pix', 'transcricao', 'email', 'copernicus', 'isometric', 'loginGoogle']);

/** Versão pública de uma checagem: mantém o veredito, remove a pista. */
function semPista(c) {
  if (!CHAVES_SENSIVEIS.has(c.id)) return c;
  return {
    ...c,
    detalhe: c.status === 'ok'
      ? 'Configurado e ativo.'
      : 'Não configurado: o módulo roda em modo demonstração.',
  };
}

diagnosticoRouter.get('/status', async (req, res) => {
  const detalhado = isAdmin(quemPede(req));
  const chaveIA = process.env.ANTHROPIC_API_KEY || '';
  const testeIA = req.query.testar === 'ia' ? await testarChave() : null;
  const supabase = await testarSupabase();
  const disco = verificarDisco();
  const usuarios = Object.values(store.users);
  const adminDefinido = config.adminEmail;
  const adminRegistrado = adminDefinido
    ? usuarios.some(u => u.email === adminDefinido)
    : null;

  const checagens = [];
  const add = (id, nome, ok, detalhe, critico = false) =>
    checagens.push({ id, nome, status: ok ? 'ok' : (critico ? 'erro' : 'atencao'), detalhe });

  // ── Aplicação ──
  add('servidor', 'Servidor no ar', true, `Porta ${config.port}`);
  const distOk = fs.existsSync(new URL('../../../web/dist/index.html', import.meta.url).pathname);
  add('frontend', 'Frontend compilado', distOk,
    distOk ? 'web/dist encontrado e sendo servido' : 'web/dist ausente: o build não rodou', true);

  // ── IA ──
  // Duas checagens antes de qualquer chamada: o prefixo e o comprimento.
  // Chave real da Anthropic passa de 100 caracteres; algo com 10 é um valor
  // truncado na hora de colar, e o prefixo sozinho não pega esse caso.
  const prefixoOk = chaveIA.startsWith('sk-ant-');
  const tamanhoOk = chaveIA.length >= COMPRIMENTO_MINIMO_CHAVE;
  add('ia', 'Inteligência artificial', config.hasApiKey && prefixoOk && tamanhoOk,
    !config.hasApiKey
      ? 'ANTHROPIC_API_KEY não definida: a plataforma roda em modo demo (tudo funciona, com geradores determinísticos)'
      : !prefixoOk
        ? 'ANTHROPIC_API_KEY definida, mas não começa com "sk-ant-": confira se colou a chave certa'
        : !tamanhoOk
          ? `ANTHROPIC_API_KEY tem só ${chaveIA.length} caracteres. Uma chave real da Anthropic passa de 100: o valor foi cortado na hora de colar. Copie de novo pelo botão de copiar do console.anthropic.com e cole inteiro, sem aspas e sem espaço no fim.`
          : `Ativa · modelo ${config.model} · chave ${pista(chaveIA, { inicio: 12 })} (${chaveIA.length} caracteres). Confirme com /api/status?testar=ia`);

  // ── Persistência ──
  add('disco', 'Persistência dos dados',
    disco.gravavel && disco.persistente !== false,
    !disco.gravavel
      ? `Não consigo gravar em ${disco.caminho}: verifique as permissões`
      : disco.persistente === false
        ? `ATENÇÃO: ${disco.caminho} não está dentro do volume montado (${process.env.RAILWAY_VOLUME_MOUNT_PATH}). Os dados serão perdidos no próximo deploy.`
        : disco.persistente === true
          ? `Volume montado em ${disco.caminho} · banco com ${(disco.bytes / 1024).toFixed(1)} KB`
          : `Gravável em ${disco.caminho} · banco com ${(disco.bytes / 1024).toFixed(1)} KB. Se não houver volume montado aqui, os dados somem a cada deploy.`,
    !disco.gravavel);

  add('supabase', 'Supabase (Postgres)', supabase.ok, supabase.mensagem);

  // ── Administrador ──
  add('admin', 'Administrador',
    Boolean(adminDefinido) || usuarios.length > 0,
    adminDefinido
      ? (adminRegistrado
        ? `Definido por ZOOMDEV_ADMIN_EMAIL: ${pista(adminDefinido, { inicio: 2, fim: 12 })} (conta já registrada)`
        : `ZOOMDEV_ADMIN_EMAIL aponta para ${pista(adminDefinido, { inicio: 2, fim: 12 })}, que ainda NÃO tem conta. Registre-se com esse e-mail para receber o painel.`)
      : usuarios.length > 0
        ? 'Sem ZOOMDEV_ADMIN_EMAIL: o primeiro usuário registrado é o administrador'
        : 'Sem ZOOMDEV_ADMIN_EMAIL e sem usuários: o primeiro a se registrar vira administrador');

  // ── Pagamentos ──
  const stripeKey = process.env.STRIPE_SECRET_KEY || '';
  const stripeFormato = /^sk_(test|live)_/.test(stripeKey);
  add('stripe', 'Stripe (assinaturas)', pagamentosConfig.stripeAtivo && stripeFormato,
    !pagamentosConfig.stripeAtivo
      ? 'Não configurado: assinatura roda em modo simulado'
      : !stripeFormato
        ? 'STRIPE_SECRET_KEY definida, mas não começa com "sk_test_" ou "sk_live_"'
        : `Ativo em modo ${stripeKey.startsWith('sk_live_') ? 'PRODUÇÃO' : 'teste'}${process.env.STRIPE_WEBHOOK_SECRET ? ' · webhook configurado' : ' · SEM webhook: a confirmação automática não vai funcionar'}`);

  add('pix', 'PIX', pagamentosConfig.pixAtivo,
    pagamentosConfig.pixAtivo
      ? `Chave ${pista(pagamentosConfig.pixChave, { inicio: 3 })} · beneficiário ${pagamentosConfig.pixNome} · ${pagamentosConfig.pixCidade}`
      : 'PIX_CHAVE não definida: o BR Code é gerado com chave de exemplo, válido para teste mas não recebe de verdade');

  // ── Transcrição de áudio do Studio ──
  // Sem a chave o recurso não some da plataforma: o ditado pelo navegador
  // continua funcionando de graça. O que se perde é anexar gravação.
  const chaveDeepgram = (process.env.DEEPGRAM_API_KEY || '').trim();
  add('transcricao', 'Transcrição de áudio (Deepgram)', Boolean(chaveDeepgram),
    chaveDeepgram
      ? `Ativa: chave ${pista(chaveDeepgram, { inicio: 4 })} · anexar áudio custa ${config.credits.transcricao} 🌿 por arquivo`
      : 'DEEPGRAM_API_KEY não definida: anexar áudio fica indisponível. O ditado por voz na caixa de contexto continua funcionando, roda no navegador e não custa nada.');

  // ── Login com Google ──
  const googleId = (process.env.GOOGLE_CLIENT_ID || '').trim();
  const googleFormato = googleId.endsWith('.apps.googleusercontent.com');
  add('loginGoogle', 'Login com Google', !googleId || googleFormato,
    !googleId
      ? 'GOOGLE_CLIENT_ID não definida: o botão "Entrar com o Google" fica oculto e o login por e-mail e senha segue normal'
      : googleFormato
        ? `Ativo: client ${pista(googleId, { inicio: 8 })} · o botão aparece na tela de login`
        : 'GOOGLE_CLIENT_ID definida, mas não termina com ".apps.googleusercontent.com": confira se colou o Client ID (e não o client secret) do console do Google Cloud');

  // ── Registro Isometric (CDR) ──
  const isoSecret = Boolean(process.env.ISOMETRIC_CLIENT_SECRET);
  const isoToken = Boolean(process.env.ISOMETRIC_TOKEN);
  add('isometric', 'Registro Isometric (CDR)', true,
    isoSecret && isoToken
      ? `Ativo em modo ${(process.env.ISOMETRIC_AMBIENTE || 'sandbox').toLowerCase() === 'producao' ? 'PRODUÇÃO' : 'sandbox'}: o benchmark CDR usa dados vivos do registro`
      : isoSecret || isoToken
        ? `Só ${isoSecret ? 'ISOMETRIC_CLIENT_SECRET' : 'ISOMETRIC_TOKEN'} está definida: faltando a outra, o benchmark segue em modo demonstração. As duas são geradas em registry.isometric.com, aba API Keys.`
        : 'ISOMETRIC_CLIENT_SECRET e ISOMETRIC_TOKEN não definidas: o benchmark CDR roda em modo demonstração (rotulado como tal)');

  // ── Satélite (NDVI) ──
  const copId = Boolean(process.env.COPERNICUS_CLIENT_ID);
  const copSecret = Boolean(process.env.COPERNICUS_CLIENT_SECRET);
  add('sentinel', 'NDVI Sentinel-2 (Copernicus)', true,
    copId && copSecret
      ? 'Ativo: a série NDVI dos lotes vem do satélite de verdade e pode virar evidência CAMPO'
      : copId || copSecret
        ? `Só ${copId ? 'COPERNICUS_CLIENT_ID' : 'COPERNICUS_CLIENT_SECRET'} está definida: faltando a outra, a série segue demonstrativa (conta gratuita em dataspace.copernicus.eu)`
        : 'COPERNICUS_CLIENT_ID e COPERNICUS_CLIENT_SECRET não definidas: a série NDVI é demonstrativa e nunca vira evidência');

  add('url', 'URL pública', Boolean(process.env.ZOOMDEV_URL),
    process.env.ZOOMDEV_URL
      ? `Definida: ${process.env.ZOOMDEV_URL}`
      : 'ZOOMDEV_URL não definida: o retorno do checkout do Stripe aponta para localhost e a lista de origens do CORS fica vazia. Defina com a URL do seu domínio.');

  // ── Blindagem de transporte ──
  const origens = origensPermitidas();
  const emProducao = process.env.NODE_ENV === 'production';
  add('blindagem', 'Blindagem de transporte', true,
    `Política de conteúdo estrita, HSTS sob HTTPS, moldura negada e fontes da própria origem. `
    + (origens.length
      ? `CORS restrito a: ${origens.join(', ')}.`
      : 'CORS sem lista: qualquer origem passa. Defina ZOOMDEV_URL para fechar.')
    + (emProducao ? '' : ' Ambiente não marcado como produção: as origens locais continuam liberadas.'));

  const erros = checagens.filter(c => c.status === 'erro');
  const atencoes = checagens.filter(c => c.status === 'atencao');

  const visiveis = detalhado ? checagens : checagens.map(semPista);
  const errosVisiveis = visiveis.filter(c => c.status === 'erro');
  const atencoesVisiveis = visiveis.filter(c => c.status === 'atencao');

  res.json({
    resumo: erros.length ? 'Há problemas críticos' : atencoes.length ? 'Funcionando, com pontos de atenção' : 'Tudo certo',
    pronto: erros.length === 0,
    detalhado,
    checagens: visiveis,
    ...(testeIA && detalhado ? { testeIA } : {}),
    ...(detalhado ? {
      plataforma: {
        ambiente: process.env.RAILWAY_ENVIRONMENT_NAME || process.env.RENDER_SERVICE_NAME || 'local',
        versaoNode: process.version,
        tempoNoAr: `${Math.floor(process.uptime() / 60)} min`,
        volumeRailway: process.env.RAILWAY_VOLUME_MOUNT_PATH || null,
      },
      ecossistema: {
        usuarios: usuarios.length,
        projetos: Object.keys(store.projects).length,
        agentes: `${CATALOGO.length} no elenco`,
      },
    } : {
      // O censo público conta o elenco, que é vitrine, e não a base de
      // usuários, que é inventário.
      ecossistema: { agentes: `${CATALOGO.length} no elenco` },
    }),
    proximosPassos: [
      ...errosVisiveis.map(e => `Corrigir: ${e.nome}, ${e.detalhe}`),
      ...atencoesVisiveis.map(a => `Opcional: ${a.nome}, ${a.detalhe}`),
      ...(errosVisiveis.length + atencoesVisiveis.length === 0 ? ['Nada pendente. Crie sua conta e comece.'] : []),
    ],
  });
});
