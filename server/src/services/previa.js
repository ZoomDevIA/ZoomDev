// ═══════════════════════════════════════════════════════════════════════════
// PRÉVIA DO MVP
//
// O produto gerado precisa rodar dentro da plataforma para ser visto. Isso
// abre duas perguntas que só têm resposta boa juntas.
//
// PRIMEIRA: um iframe não carrega o cabeçalho de autorização, então buscar a
// página numa rota autenticada devolvia 401. A resposta é um bilhete de curta
// duração no endereço, emitido por quem já está autenticado.
//
// SEGUNDA, mais séria: com política de conteúdo estrita na plataforma, um
// documento em srcdoc herda essa política e o código gerado, que é todo
// embutido, simplesmente não roda. E afrouxar a política do aplicativo
// inteiro para que a prévia funcione seria trocar a segurança de tudo pela
// conveniência de uma tela.
//
// Por isso a prévia é servida por uma rota própria, com política própria: o
// diretivo `sandbox` joga o documento numa origem opaca. Ele desenha, roda
// script e recebe clique, mas não enxerga o armazenamento da plataforma, não
// lê o token de ninguém e não chama a API.
//
// A consequência de estar em origem opaca é que localStorage lança exceção.
// Como o MVP gerado guarda estado justamente ali, entra um substituto em
// memória no topo do documento: a prévia funciona igual, e o que for digitado
// nela morre quando a aba fecha, que é o comportamento correto para uma
// prévia.
// ═══════════════════════════════════════════════════════════════════════════

import crypto from 'node:crypto';

const VALIDADE_MS = 10 * 60 * 1000;   // dez minutos bastam para olhar e ajustar
const TETO = 200;                      // instantâneos vivos ao mesmo tempo

const instantaneos = new Map();

/**
 * Guarda um instantâneo dos arquivos e devolve o bilhete de acesso.
 * `arquivos`: [{ arquivo, conteudo }]
 */
export function emitirPrevia({ userId, projetoId, arquivos, pagina }) {
  limparVencidos();

  // Teto simples contra acúmulo: sai o mais antigo. É prévia, não acervo.
  if (instantaneos.size >= TETO) {
    const maisAntigo = [...instantaneos.entries()].sort((a, b) => a[1].em - b[1].em)[0];
    if (maisAntigo) instantaneos.delete(maisAntigo[0]);
  }

  const bilhete = crypto.randomBytes(24).toString('base64url');
  instantaneos.set(bilhete, {
    userId, projetoId, pagina: pagina || 'index.html',
    arquivos: (arquivos || []).map(a => ({ arquivo: a.arquivo, conteudo: String(a.conteudo ?? '') })),
    em: Date.now(),
    expira: Date.now() + VALIDADE_MS,
  });

  return { bilhete, expiraEm: new Date(Date.now() + VALIDADE_MS).toISOString() };
}

export function lerPrevia(bilhete) {
  limparVencidos();
  const p = instantaneos.get(bilhete);
  if (!p || p.expira < Date.now()) return null;
  return p;
}

function limparVencidos() {
  const agora = Date.now();
  for (const [k, v] of instantaneos) if (v.expira < agora) instantaneos.delete(k);
}

/** Só para os testes: devolve quantos instantâneos estão vivos. */
export function previasVivas() {
  limparVencidos();
  return instantaneos.size;
}

// ═══════════════════════════════════════════════════════════════════════════
// MONTAGEM DO DOCUMENTO
// ═══════════════════════════════════════════════════════════════════════════

const SUBSTITUTO_ARMAZENAMENTO = `<script>
/* A prévia roda em origem opaca, onde localStorage lança exceção. Este
   substituto em memória mantém o MVP funcionando; o que for digitado aqui
   some ao fechar a aba, que é o certo para uma prévia. */
(function () {
  function daPara(nome) {
    try { var s = window[nome]; s.setItem('__zd', '1'); s.removeItem('__zd'); return true; }
    catch (e) { return false; }
  }
  function memoria() {
    var d = Object.create(null);
    return {
      getItem: function (k) { return k in d ? d[k] : null; },
      setItem: function (k, v) { d[k] = String(v); },
      removeItem: function (k) { delete d[k]; },
      clear: function () { d = Object.create(null); },
      key: function (i) { return Object.keys(d)[i] || null; },
      get length() { return Object.keys(d).length; }
    };
  }
  ['localStorage', 'sessionStorage'].forEach(function (nome) {
    if (daPara(nome)) return;
    try { Object.defineProperty(window, nome, { value: memoria(), configurable: true }); }
    catch (e) { window[nome] = memoria(); }
  });
})();
</script>`;

const AVISO_NAVEGACAO = `<script>
/* Links entre páginas locais não navegam dentro da prévia: viram aviso no
   console em vez de erro de rede sem explicação. */
document.addEventListener('click', function (e) {
  var a = e.target && e.target.closest && e.target.closest('a[href]');
  if (!a) return;
  var href = a.getAttribute('href') || '';
  if (/^https?:/i.test(href) || href.charAt(0) === '#') return;
  e.preventDefault();
  console.info('Prévia: navegação para ' + href + ' desativada. Abra o arquivo no editor.');
}, true);
</script>`;

/**
 * Compõe o HTML da prévia: embute o CSS e o JS referenciados, porque não há
 * servidor de arquivos por trás, e injeta os dois auxiliares.
 */
export function montarPrevia(arquivos, pagina = 'index.html') {
  const ler = (nome) => arquivos.find(a => a.arquivo === nome)?.conteudo ?? '';

  let html = ler(pagina) || ler('index.html');
  if (!html) {
    return '<!doctype html><meta charset="utf-8">'
      + '<p style="font:14px system-ui;padding:24px">Sem página para exibir.</p>';
  }

  html = html.replace(/<link[^>]+href=["']([^"']+\.css)["'][^>]*>/gi, (todo, arquivo) => {
    const css = ler(arquivo.replace(/^\.?\//, ''));
    return css ? `<style>\n${css}\n</style>` : todo;
  });

  html = html.replace(/<script[^>]+src=["']([^"']+\.js)["'][^>]*>\s*<\/script>/gi, (todo, arquivo) => {
    const js = ler(arquivo.replace(/^\.?\//, ''));
    return js ? `<script>\n${js}\n</script>` : todo;
  });

  // O substituto de armazenamento precisa vir ANTES de qualquer script do
  // produto, senão o primeiro getItem já estoura.
  html = html.includes('<head>')
    ? html.replace('<head>', `<head>\n${SUBSTITUTO_ARMAZENAMENTO}`)
    : SUBSTITUTO_ARMAZENAMENTO + html;

  return html.includes('</body>')
    ? html.replace('</body>', `${AVISO_NAVEGACAO}</body>`)
    : html + AVISO_NAVEGACAO;
}
