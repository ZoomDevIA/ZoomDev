// ═══════════════════════════════════════════════════════════════════════════
// LIMITE DE REQUISIÇÕES — freio nas rotas que aceitam tentativa infinita.
//
// Janela deslizante em memória, por chave. Memória basta: a plataforma roda
// em um processo só, e um reinício zerar a contagem é aceitável para o que
// isto protege. Se um dia houver várias instâncias, esta é a peça que muda,
// e só ela.
//
// A conta é por IP E por identificador do corpo (o e-mail, quando existe).
// Só por IP, um prédio inteiro atrás de um NAT se pune junto; só por e-mail,
// basta variar o endereço para contornar. Os dois juntos fecham os dois lados.
// ═══════════════════════════════════════════════════════════════════════════

const janelas = new Map();   // chave → { inicio, contagem }

function ipDe(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
    || req.socket?.remoteAddress
    || 'desconhecido';
}

function conferir(chave, max, janelaMs) {
  const agora = Date.now();
  const atual = janelas.get(chave);
  if (!atual || agora - atual.inicio > janelaMs) {
    janelas.set(chave, { inicio: agora, contagem: 1 });
    return { permitido: true, restantes: max - 1, esperaSeg: 0 };
  }
  atual.contagem += 1;
  const permitido = atual.contagem <= max;
  return {
    permitido,
    restantes: Math.max(0, max - atual.contagem),
    esperaSeg: permitido ? 0 : Math.ceil((janelaMs - (agora - atual.inicio)) / 1000),
  };
}

// Faxina periódica: sem isso o mapa cresce para sempre em servidor de vida longa.
setInterval(() => {
  const agora = Date.now();
  for (const [chave, v] of janelas) {
    if (agora - v.inicio > 3600_000) janelas.delete(chave);
  }
}, 600_000).unref?.();

/**
 * Middleware de limite.
 * @param {object} opcoes
 * @param {number} opcoes.max        tentativas permitidas na janela
 * @param {number} opcoes.janelaSeg  tamanho da janela
 * @param {string} opcoes.campo      campo do corpo que identifica o alvo
 * @param {string} opcoes.mensagem   texto devolvido ao estourar
 */
export function limitar({ max = 10, janelaSeg = 60, campo = 'email', mensagem } = {}) {
  const janelaMs = janelaSeg * 1000;
  return (req, res, next) => {
    const alvo = String(req.body?.[campo] || '').trim().toLowerCase();
    const chaves = [`ip:${req.path}:${ipDe(req)}`];
    if (alvo) chaves.push(`alvo:${req.path}:${alvo}`);

    let pior = { permitido: true, restantes: max, esperaSeg: 0 };
    for (const chave of chaves) {
      const r = conferir(chave, max, janelaMs);
      if (!r.permitido || r.restantes < pior.restantes) pior = r;
    }

    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(pior.restantes));

    if (!pior.permitido) {
      res.setHeader('Retry-After', String(pior.esperaSeg));
      return res.status(429).json({
        error: mensagem || `Muitas tentativas. Aguarde ${pior.esperaSeg}s e tente de novo.`,
        esperaSeg: pior.esperaSeg,
      });
    }
    next();
  };
}

/** Só para os testes: zera o estado entre casos. */
export function zerarLimites() { janelas.clear(); }
