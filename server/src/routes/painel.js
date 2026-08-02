// ═══════════════════════════════════════════════════════════════════════════
// ROTAS /api/painel: área de administração com porta própria.
//
// Fluxo: o usuário já está logado na plataforma → confirma a senha em
// POST /sessao → recebe um token de 30 min que vai no header x-zd-painel.
// Todas as rotas abaixo de exigirElevacao pedem esse token, e cada mutação
// grava uma linha na trilha de auditoria.
//
// Autorização em duas dimensões:
//   · elevação: provou que é você, agora, nesta janela
//   · capacidade: o seu papel permite esta ação específica
// As duas precisam passar. Elevação sem capacidade não faz nada.
// ═══════════════════════════════════════════════════════════════════════════
import { Router } from 'express';
import { store, save } from '../store.js';
import {
  criarUsuario, publicUser, papelDe, consolidarBootstrap,
  encerrarSessoesDe, hashSenha, exigir,
} from '../auth.js';
import { catalogoPapeis, PAPEIS, PAPEIS_ATRIBUIVEIS } from '../services/permissoes.js';
import {
  elevar, encerrar, estadoSessao, exigirElevacao, listarAuditoria, registrarAuditoria,
} from '../services/sessaoPainel.js';
import { listarParaCuradoria, alternarDestaque, alternarOculto } from '../services/vitrine.js';

export const painelRouter = Router();

// ── Porta de entrada ───────────────────────────────────────────────────────
painelRouter.post('/sessao', (req, res, next) => {
  try { res.json(elevar(req)); } catch (e) { next(e); }
});

painelRouter.get('/sessao', (req, res) => res.json(estadoSessao(req)));
painelRouter.delete('/sessao', (req, res) => res.json(encerrar(req)));

// Daqui para baixo, tudo exige a sessão elevada.
painelRouter.use(exigirElevacao);

// Quem sou eu aqui dentro e o que este papel me deixa fazer
painelRouter.get('/contexto', (req, res) => {
  const papel = papelDe(req.user);
  res.json({
    usuario: { id: req.user.id, nome: req.user.nome, email: req.user.email },
    papel,
    papeis: catalogoPapeis(),
    papeisAtribuiveis: PAPEIS_ATRIBUIVEIS,
    capacidades: PAPEIS[papel].capacidades,
    expiraEm: req.painel.expiraEm,
  });
});

// ── Gestão de usuários ─────────────────────────────────────────────────────
function usuarioParaPainel(u) {
  const projetos = Object.values(store.projects).filter(p => p.userId === u.id);
  return {
    id: u.id,
    nome: u.nome,
    email: u.email,
    papel: papelDe(u),
    ativo: u.ativo !== false,
    plano: u.plano,
    criadoEm: u.criadoEm,
    projetos: projetos.length,
    publicados: projetos.filter(p => p.publicado).length,
    ultimoAcesso: u.ultimoAcesso || null,
  };
}

painelRouter.get('/usuarios', exigir('usuarios.ler'), (_req, res) => {
  const lista = Object.values(store.users)
    .map(usuarioParaPainel)
    .sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));
  res.json({
    usuarios: lista,
    resumo: {
      total: lista.length,
      admins: lista.filter(u => u.papel === 'admin').length,
      editores: lista.filter(u => u.papel === 'editor').length,
      fundadores: lista.filter(u => u.papel === 'fundador').length,
      inativos: lista.filter(u => !u.ativo).length,
    },
  });
});

painelRouter.post('/usuarios', exigir('usuarios.gerenciar'), (req, res, next) => {
  try {
    const { email, nome, senha, papel } = req.body || {};
    if (!PAPEIS_ATRIBUIVEIS.includes(papel)) {
      return res.status(400).json({ error: `Escolha um dos papéis atribuíveis: ${PAPEIS_ATRIBUIVEIS.join(', ')}.` });
    }
    const novo = criarUsuario({ email, nome, senha, papel });
    req.auditar('usuario.criado', { alvo: novo.id, detalhe: `${novo.email} como ${papel}` });
    res.json(usuarioParaPainel(store.users[novo.id]));
  } catch (e) { next(e); }
});

painelRouter.patch('/usuarios/:id', exigir('usuarios.gerenciar'), (req, res, next) => {
  try {
    const alvo = store.users[req.params.id];
    if (!alvo) return res.status(404).json({ error: 'Usuário não encontrado.' });
    const { papel, ativo, nome, senha } = req.body || {};
    const mudancas = [];

    // Trava de segurança: a plataforma nunca pode ficar sem administrador ativo.
    const admins = Object.values(store.users).filter(u => papelDe(u) === 'admin' && u.ativo !== false);
    const ehUltimoAdmin = papelDe(alvo) === 'admin' && admins.length <= 1 && admins[0]?.id === alvo.id;
    if (ehUltimoAdmin && ((papel && papel !== 'admin') || ativo === false)) {
      return res.status(409).json({ error: 'Este é o último administrador ativo. Promova outra pessoa antes de alterar este acesso.' });
    }

    if (papel !== undefined) {
      if (!PAPEIS[papel]) return res.status(400).json({ error: 'Papel inválido.' });
      consolidarBootstrap();
      alvo.papel = papel;
      mudancas.push(`papel → ${papel}`);
      encerrarSessoesDe(alvo.id);   // o novo papel vale a partir do próximo login
    }
    if (ativo !== undefined) {
      alvo.ativo = Boolean(ativo);
      mudancas.push(alvo.ativo ? 'reativado' : 'desativado');
      if (!alvo.ativo) encerrarSessoesDe(alvo.id);
    }
    if (nome) { alvo.nome = String(nome).slice(0, 80); mudancas.push('nome alterado'); }
    if (senha) {
      if (String(senha).length < 8) return res.status(400).json({ error: 'A senha precisa de pelo menos 8 caracteres.' });
      alvo.passwordHash = hashSenha(String(senha));
      encerrarSessoesDe(alvo.id);
      mudancas.push('senha redefinida');
    }

    save();
    req.auditar('usuario.alterado', { alvo: alvo.id, detalhe: `${alvo.email}: ${mudancas.join(', ') || 'sem mudanças'}` });
    res.json(usuarioParaPainel(alvo));
  } catch (e) { next(e); }
});

painelRouter.delete('/usuarios/:id', exigir('usuarios.gerenciar'), (req, res) => {
  const alvo = store.users[req.params.id];
  if (!alvo) return res.status(404).json({ error: 'Usuário não encontrado.' });
  if (alvo.id === req.user.id) return res.status(409).json({ error: 'Você não pode remover a própria conta.' });
  const admins = Object.values(store.users).filter(u => papelDe(u) === 'admin' && u.ativo !== false);
  if (papelDe(alvo) === 'admin' && admins.length <= 1) {
    return res.status(409).json({ error: 'Este é o último administrador ativo.' });
  }
  // Desativa em vez de apagar: os projetos e a trilha de auditoria continuam
  // fazendo sentido, e um acesso removido por engano volta com um clique.
  alvo.ativo = false;
  encerrarSessoesDe(alvo.id);
  save();
  req.auditar('usuario.desativado', { alvo: alvo.id, detalhe: alvo.email });
  res.json(usuarioParaPainel(alvo));
});

// ── Curadoria da vitrine ───────────────────────────────────────────────────
painelRouter.get('/vitrine', exigir('comunidade.curar'), (_req, res) => {
  res.json(listarParaCuradoria());
});

painelRouter.post('/vitrine/:id/destaque', exigir('comunidade.curar'), (req, res) => {
  const destacar = req.body?.destacar !== false;
  alternarDestaque(req.params.id, destacar);
  req.auditar('vitrine.destaque', { alvo: req.params.id, detalhe: destacar ? 'destacado' : 'destaque removido' });
  res.json(listarParaCuradoria());
});

painelRouter.post('/vitrine/:id/ocultar', exigir('comunidade.curar'), (req, res) => {
  const ocultar = req.body?.ocultar !== false;
  alternarOculto(req.params.id, ocultar);
  req.auditar('vitrine.ocultacao', { alvo: req.params.id, detalhe: ocultar ? 'oculto' : 'reexibido' });
  res.json(listarParaCuradoria());
});

// ── Trilha de auditoria ────────────────────────────────────────────────────
painelRouter.get('/auditoria', exigir('sistema.configurar'), (req, res) => {
  res.json(listarAuditoria(req.query.limite));
});

export { registrarAuditoria };
