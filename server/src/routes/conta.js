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
import { publicUser } from '../auth.js';
import { trocarSenha } from '../services/recuperacaoSenha.js';
import { exportarDados, excluirConta, registrarAceiteTermos, VERSAO_TERMOS } from '../services/lgpd.js';
import { limitar } from '../services/limite.js';

export const contaRouter = Router();

// Editar o perfil. O e-mail não entra: trocar endereço exige confirmar o novo,
// e esse fluxo pede uma rota própria em vez de um campo solto aqui.
contaRouter.patch('/', (req, res) => {
  const { nome } = req.body || {};
  if (nome !== undefined) {
    const limpo = String(nome).trim();
    if (limpo.length < 2) return res.status(400).json({ error: 'O nome precisa de pelo menos 2 caracteres.' });
    req.user.nome = limpo.slice(0, 80);
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
