// ═══════════════════════════════════════════════════════════════════════════
// ROTAS DA CONTA — o que o titular pode fazer sozinho, sem falar com ninguém:
// trocar a senha, editar o perfil, levar seus dados embora e sumir da base.
//
// Tudo aqui já passou pelo authMiddleware. As rotas públicas de recuperação
// (pedir e redefinir) ficam no index, antes da autenticação, porque quem
// esqueceu a senha justamente não consegue se autenticar.
// ═══════════════════════════════════════════════════════════════════════════
import { Router } from 'express';
import { save } from '../store.js';
import { publicUser, encerrarSessao, encerrarSessoesDe, sessoesDe } from '../auth.js';
import { trocarSenha } from '../services/recuperacaoSenha.js';
import { exportarDados, excluirConta, registrarAceiteTermos, VERSAO_TERMOS } from '../services/lgpd.js';
import { limitar } from '../services/limite.js';
import { enviar } from '../services/email.js';

export const contaRouter = Router();

// ── Tema ──────────────────────────────────────────────────────────────────
// O tema é escolhido no navegador e guardado aqui para seguir a pessoa de um
// aparelho para outro. Como vem inteiro do cliente, entra por lista fechada:
// campo fora da lista é descartado, valor fora do formato é descartado, e o
// que sobra nunca passa de um punhado de bytes.
//
// O cliente valida de novo ao aplicar. Esta camada existe para o caso de
// alguém escrever direto na rota, e para o dia em que um campo for aposentado.
const HEX = /^#[0-9a-f]{6}$/i;
const TEXTO = /^[a-z]{1,20}$/;
const CAMPOS_TEMA = {
  acento: v => (HEX.test(v) ? String(v).toLowerCase() : undefined),
  marca: v => (HEX.test(v) ? String(v).toLowerCase() : undefined),
  fundo: v => (TEXTO.test(v) ? v : undefined),
  fonteTitulo: v => (TEXTO.test(v) ? v : undefined),
  fonteCorpo: v => (TEXTO.test(v) ? v : undefined),
  arestas: v => (TEXTO.test(v) ? v : undefined),
  densidade: v => (TEXTO.test(v) ? v : undefined),
  movimento: v => (TEXTO.test(v) ? v : undefined),
  textura: v => (typeof v === 'boolean' ? v : undefined),
  som: v => (typeof v === 'boolean' ? v : undefined),
  volume: v => (Number.isFinite(Number(v)) ? Math.min(1, Math.max(0, Number(v))) : undefined),
};

function limparTema(bruto) {
  if (!bruto || typeof bruto !== 'object') return null;
  const limpo = {};
  for (const [campo, validar] of Object.entries(CAMPOS_TEMA)) {
    const v = validar(bruto[campo]);
    if (v !== undefined) limpo[campo] = v;
  }
  return Object.keys(limpo).length ? limpo : null;
}

// Editar o perfil. O e-mail não entra: trocar endereço exige confirmar o novo,
// e esse fluxo pede uma rota própria em vez de um campo solto aqui.
contaRouter.patch('/', (req, res) => {
  const { nome, tema } = req.body || {};
  if (nome !== undefined) {
    const limpo = String(nome).trim();
    if (limpo.length < 2) return res.status(400).json({ error: 'O nome precisa de pelo menos 2 caracteres.' });
    req.user.nome = limpo.slice(0, 80);
  }
  if (tema !== undefined) {
    const limpo = limparTema(tema);
    if (!limpo) return res.status(400).json({ error: 'Tema inválido.' });
    req.user.tema = limpo;
  }
  save();
  res.json(publicUser(req.user));
});

contaRouter.post('/senha', limitar({ max: 5, janelaSeg: 900, campo: 'atual', mensagem: 'Muitas tentativas de troca de senha. Aguarde.' }),
  async (req, res, next) => {
    try {
      const { atual, nova } = req.body || {};
      await trocarSenha(req.user, { atual, nova });
      // A troca encerra todas as sessões, inclusive esta: o cliente precisa
      // saber disso para levar a pessoa de volta ao login em vez de deixá-la
      // clicando numa tela que já não responde.
      res.json({ ok: true, sessoesEncerradas: true });
    } catch (e) { next(e); }
  });

// ── Sessões abertas ───────────────────────────────────────────────────────
// Lembrar de um computador deixado aberto num escritório é um momento de
// pressa. Estas duas rotas existem para que a resposta seja um clique, e não
// "troque a senha, decore a nova e entre de novo em todos os aparelhos".
//
// Nenhuma delas pede a senha, de propósito. Quem já está autenticado só pode
// se derrubar da própria conta, o que no pior caso é um inconveniente, e
// exigir a senha justamente no minuto do susto trabalharia contra a segurança
// em vez de a favor.
contaRouter.get('/sessoes', (req, res) => {
  res.json({ sessoes: sessoesDe(req.user.id, req.sessionToken) });
});

// Desconectar UM aparelho. Encerrar tudo é a resposta do pânico; esta é a do
// dia a dia, quando você reconhece na lista o computador que não deveria estar
// lá e quer só aquele fora.
contaRouter.delete('/sessoes/:id', (req, res) => {
  const r = encerrarSessao(req.user.id, String(req.params.id || ''));
  if (!r.encerrada) return res.status(404).json({ error: 'Esta sessão já não está aberta.' });
  save();
  res.json({ ok: true, aparelho: r.aparelho, eraAtual: r.token === req.sessionToken });
});

contaRouter.post('/sessoes/encerrar', async (req, res, next) => {
  try {
    const manterAtual = req.body?.manterAtual !== false;
    const encerradas = encerrarSessoesDe(req.user.id, {
      exceto: manterAtual ? req.sessionToken : null,
    });
    save();

    // O aviso por e-mail é o que fecha o ciclo: se este encerramento não foi
    // você, o e-mail é como você fica sabendo.
    await enviar({
      para: req.user.email,
      assunto: 'Sessões encerradas na ZoomDev',
      texto: `Olá, ${req.user.nome.split(' ')[0]}.\n\n`
        + `${encerradas} sessão(ões) da sua conta foram encerradas em ${new Date().toLocaleString('pt-BR')}.\n`
        + `${manterAtual ? 'O aparelho de onde o pedido saiu continua conectado.' : 'Todos os aparelhos foram desconectados, inclusive o de onde o pedido saiu.'}\n\n`
        + 'Se não foi você, troque sua senha agora mesmo.',
      html: `<p>Olá, ${req.user.nome.split(' ')[0]}.</p>`
        + `<p><b>${encerradas}</b> sessão(ões) da sua conta foram encerradas em ${new Date().toLocaleString('pt-BR')}.</p>`
        + `<p>${manterAtual ? 'O aparelho de onde o pedido saiu continua conectado.' : 'Todos os aparelhos foram desconectados, inclusive o de onde o pedido saiu.'}</p>`
        + '<p>Se não foi você, troque sua senha agora mesmo.</p>',
    }).catch(() => { /* o encerramento vale mesmo sem e-mail configurado */ });

    res.json({ ok: true, encerradas, sessaoAtualMantida: manterAtual });
  } catch (e) { next(e); }
});

contaRouter.post('/termos', (req, res) => {
  res.json(registrarAceiteTermos(req.user));
});

contaRouter.get('/exportar', (req, res) => {
  const dados = exportarDados(req.user);
  const selo = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="zoomdev-meus-dados-${selo}.json"`);
  res.send(JSON.stringify(dados, null, 2));
});

// Exclusão definitiva. Exige a senha, porque uma sessão esquecida aberta num
// computador emprestado não pode apagar a conta de alguém.
contaRouter.delete('/', async (req, res, next) => {
  try {
    const { senha, removerPublicados } = req.body || {};
    const { conferirSenha } = await import('../auth.js');
    if (!conferirSenha(senha, req.user.passwordHash)) {
      return res.status(401).json({ error: 'Confirme sua senha para excluir a conta.' });
    }
    const { papelDe } = await import('../auth.js');
    const { store } = await import('../store.js');
    const admins = Object.values(store.users).filter(u => papelDe(u) === 'admin' && u.ativo !== false);
    if (papelDe(req.user) === 'admin' && admins.length <= 1) {
      return res.status(409).json({
        error: 'Você é o último administrador ativo. Promova outra pessoa antes de excluir sua conta.',
      });
    }
    res.json(excluirConta(req.user, { removerPublicados: Boolean(removerPublicados) }));
  } catch (e) { next(e); }
});

export { VERSAO_TERMOS };
