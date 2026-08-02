// ═══════════════════════════════════════════════════════════════════════════
// PERMISSÕES: três papéis, uma matriz de capacidades.
//
// A regra é sempre a mesma: o código nunca pergunta "esse usuário é admin?".
// Pergunta "esse usuário pode fazer X?". Assim um papel novo é uma linha na
// matriz, não uma caçada por ifs espalhados pelo sistema.
//
// FUNDADOR  constrói o que é dele. Não enxerga nem toca no que é dos outros.
// EDITOR    cuida da vitrine e do conhecimento: cura a comunidade, gerencia
//           editais, lê o elenco e a lista de pessoas. Não muda o sistema,
//           não mexe na mente dos agentes, não vê dinheiro, não cria gente.
// ADMIN     tudo, inclusive criar usuários e evoluir os PICs.
//
// O corte do editor é deliberado: ele opera a plataforma no dia a dia sem
// poder alterar a plataforma em si. É o nível que se dá a quem trabalha com
// você antes de você confiar as chaves do cofre.
// ═══════════════════════════════════════════════════════════════════════════

export const CAPACIDADES = {
  'plataforma.usar': 'Criar projetos, gerar planos e construir MVPs',
  'comunidade.publicar': 'Publicar os próprios projetos na vitrine',
  'comunidade.curar': 'Destacar, ocultar ou remover projetos de terceiros da vitrine',
  'conteudo.editar': 'Editar os textos e destaques da home e dos módulos',
  'editais.gerenciar': 'Disparar varreduras e curar o radar de editais',
  'agentes.ler': 'Consultar o elenco e os protocolos cognitivos',
  'agentes.ativar': 'Ligar e desligar agentes da reserva',
  'agentes.evoluir': 'Aprovar, rejeitar e reverter evoluções de PIC',
  'usuarios.ler': 'Ver quem tem acesso à plataforma',
  'usuarios.gerenciar': 'Criar, alterar papel e desativar usuários',
  'financeiro.ler': 'Ver transações, assinaturas e receita',
  'sistema.configurar': 'Alterar configurações, integrações e diagnósticos',
};

export const PAPEIS = {
  admin: {
    id: 'admin',
    nome: 'Administrador',
    emoji: '🛡️',
    cor: '#00ff64',
    resumo: 'Controle total da plataforma, do elenco de agentes ao cofre.',
    capacidades: Object.keys(CAPACIDADES),
  },
  editor: {
    id: 'editor',
    nome: 'Editor',
    emoji: '✍️',
    cor: '#00c8ff',
    resumo: 'Opera a plataforma no dia a dia: vitrine, editais e conteúdo. Não altera o sistema nem a mente dos agentes.',
    capacidades: [
      'plataforma.usar',
      'comunidade.publicar',
      'comunidade.curar',
      'conteudo.editar',
      'editais.gerenciar',
      'agentes.ler',
      'usuarios.ler',
    ],
  },
  fundador: {
    id: 'fundador',
    nome: 'Fundador',
    emoji: '🚀',
    cor: '#ffd700',
    resumo: 'Constrói os próprios projetos. É o papel de quem se cadastra sozinho na plataforma.',
    capacidades: ['plataforma.usar', 'comunidade.publicar'],
  },
};

export const PAPEIS_ATRIBUIVEIS = ['admin', 'editor'];

/** Papel efetivo do usuário. `bootstrapAdmin` cobre a instalação recém-criada. */
export function papelDe(user, { bootstrapAdmin = false } = {}) {
  if (!user) return null;
  if (bootstrapAdmin) return 'admin';
  return PAPEIS[user.papel] ? user.papel : 'fundador';
}

export function capacidadesDe(papel) {
  return PAPEIS[papel]?.capacidades || [];
}

/** Pergunta central do sistema. Usuário desativado não pode nada. */
export function pode(user, capacidade, { bootstrapAdmin = false } = {}) {
  if (!user || user.ativo === false) return false;
  return capacidadesDe(papelDe(user, { bootstrapAdmin })).includes(capacidade);
}

/** Descreve um papel para a interface, com a lista legível do que ele libera. */
export function descreverPapel(papelId) {
  const p = PAPEIS[papelId];
  if (!p) return null;
  return {
    ...p,
    permite: p.capacidades.map(c => ({ id: c, descricao: CAPACIDADES[c] })),
    naoPermite: Object.entries(CAPACIDADES)
      .filter(([c]) => !p.capacidades.includes(c))
      .map(([id, descricao]) => ({ id, descricao })),
  };
}

export function catalogoPapeis() {
  return Object.keys(PAPEIS).map(descreverPapel);
}
