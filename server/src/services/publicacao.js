// ═══════════════════════════════════════════════════════════════════════════
// PUBLICAÇÃO DO MVP
//
// O construtor entregava um ZIP. Um ZIP não é um produto: é um arquivo que o
// fundador precisa hospedar em algum lugar antes de mostrar para alguém. Entre
// "tenho um ZIP" e "mandei o link no WhatsApp" existe um abismo de fricção que
// derruba a maioria dos projetos.
//
// Aqui o site ganha endereço próprio e vai ao ar. E o formulário dele passa a
// entregar de verdade: o lead chega no e-mail do fundador em vez de morrer no
// localStorage do visitante.
//
// ═══ A DECISÃO DE SEGURANÇA QUE MANDA NESTE ARQUIVO ═══
//
// O site é código gerado por IA, servido do MESMO domínio da plataforma. Sem
// cuidado, o JavaScript desse site leria `localStorage` da origem, onde mora o
// token de quem estiver logado na ZoomDev. Bastaria um MVP mal gerado, ou uma
// instrução escondida num anexo, para virar roubo de sessão.
//
// A resposta é o diretivo `sandbox` na política de conteúdo: o documento cai
// numa ORIGEM OPACA. Desenha, roda script, aceita clique e envia formulário,
// mas não enxerga o armazenamento nem os dados da plataforma.
//
// O preço é que `localStorage` lança exceção lá dentro, e o MVP gerado guarda
// estado nele. Por isso entra o mesmo substituto em memória da prévia. Para um
// site publicado isso é o comportamento certo: o que interessa persistir é o
// lead, e o lead vai para o servidor.
//
// Quando existir domínio por site, a origem já será outra e a restrição pode
// afrouxar. Até lá, é isto que torna a publicação segura hoje.
// ═══════════════════════════════════════════════════════════════════════════

import { store, save } from '../store.js';
import { lerConteudo, gravarConteudo, arquivosMvp } from './conteudo.js';
import { enviar } from './email.js';

export const PREFIXO = '/s';

const RESERVADOS = new Set([
  'api', 'assets', 'previa', 'admin', 'painel', 'studio', 'projetos', 'entrar',
  'termos', 'privacidade', 'home', 'zoomdev', 'www', 'app', 's', 'lead', 'sobre',
]);

const MAX_LEADS = 500;

// ── Endereço ───────────────────────────────────────────────────────────────

/** Nome vira endereço: minúsculas, sem acento, hífen no lugar de espaço. */
export function sugerirSlug(nome) {
  const base = String(nome || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return base || 'projeto';
}

export function slugValido(slug) {
  return /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/.test(slug) && !RESERVADOS.has(slug);
}

/** Primeiro livre a partir do desejado: `acai`, `acai-2`, `acai-3`. */
function slugLivre(desejado, projetoId) {
  const base = sugerirSlug(desejado);
  for (let n = 1; n < 200; n++) {
    const tentativa = n === 1 ? base : `${base}-${n}`;
    if (!slugValido(tentativa)) continue;
    const dono = store.sites[tentativa];
    if (!dono || dono.projetoId === projetoId) return tentativa;
  }
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

// ── Publicar e despublicar ────────────────────────────────────────────────

export function publicarSite(proj, { slug } = {}) {
  const arquivos = arquivosMvp(proj.id);
  if (!arquivos.length) {
    throw Object.assign(new Error('Construa o MVP antes de publicar o site.'), { status: 409 });
  }
  if (!arquivos.some(a => a.arquivo === 'index.html')) {
    throw Object.assign(new Error('O site precisa de um index.html para ter uma página inicial.'), { status: 409 });
  }

  if (slug) {
    const pedido = sugerirSlug(slug);
    if (!slugValido(pedido)) {
      throw Object.assign(
        new Error('Endereço inválido. Use de 3 a 40 letras, números e hífen, começando e terminando com letra ou número.'),
        { status: 400 },
      );
    }
    const dono = store.sites[pedido];
    if (dono && dono.projetoId !== proj.id) {
      throw Object.assign(new Error(`O endereço "${pedido}" já está em uso. Escolha outro.`), { status: 409 });
    }
  }

  const anterior = proj.site?.slug;
  const novo = slug ? sugerirSlug(slug) : (anterior || slugLivre(proj.nome, proj.id));

  // Trocar de endereço libera o antigo: deixá-lo preso serviria só para
  // impedir que outra pessoa usasse um nome que ninguém mais quer.
  if (anterior && anterior !== novo) delete store.sites[anterior];

  // O que vai ao ar é uma CÓPIA do código no momento da publicação. Sem isso,
  // qualquer rascunho salvo no editor apareceria no ar imediatamente, e o
  // fundador não teria como mexer no produto sem mexer no que está publicado.
  gravarConteudo(proj.id, { siteArquivos: arquivos });

  store.sites[novo] = {
    projetoId: proj.id,
    userId: proj.userId,
    publicadoEm: new Date().toISOString(),
  };

  proj.site = {
    slug: novo,
    publicadoEm: store.sites[novo].publicadoEm,
    atualizadoEm: new Date().toISOString(),
    paginas: arquivos.filter(a => a.arquivo.endsWith('.html')).map(a => a.arquivo),
    visitas: proj.site?.visitas || 0,
    leads: proj.site?.leads || 0,
  };
  save();

  return { slug: novo, caminho: `${PREFIXO}/${novo}`, url: urlPublica(novo) };
}

export function despublicarSite(proj) {
  if (proj.site?.slug) delete store.sites[proj.site.slug];
  gravarConteudo(proj.id, { siteArquivos: undefined });
  delete proj.site;
  save();
}

export function urlPublica(slug) {
  const base = (process.env.ZOOMDEV_URL || '').split(',')[0].trim().replace(/\/$/, '');
  return `${base}${PREFIXO}/${slug}`;
}

/** Resolve o endereço para o projeto publicado, ou nulo. */
export function siteDoSlug(slug) {
  const registro = store.sites[slug];
  if (!registro) return null;
  const proj = store.projects[registro.projetoId];
  if (!proj || !proj.site) return null;
  return { proj, registro, arquivos: lerConteudo(proj.id).siteArquivos || [] };
}

export function registrarVisita(proj) {
  if (!proj.site) return;
  proj.site.visitas = (proj.site.visitas || 0) + 1;
  // Sem save() aqui: contador de visita não vale uma gravação em disco por
  // acesso. O próximo save de qualquer outra coisa leva o número junto.
}

// ═══════════════════════════════════════════════════════════════════════════
// MONTAGEM DA PÁGINA
// ═══════════════════════════════════════════════════════════════════════════

const SUBSTITUTO_ARMAZENAMENTO = `<script>
/* O site roda em origem opaca, onde localStorage lança exceção. Este
   substituto em memória mantém o produto funcionando. O que precisa
   sobreviver de verdade é o lead, e o lead vai para o servidor. */
(function () {
  function daPara(n) { try { var s = window[n]; s.setItem('__zd','1'); s.removeItem('__zd'); return true; } catch (e) { return false; } }
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
  ['localStorage', 'sessionStorage'].forEach(function (n) {
    if (daPara(n)) return;
    try { Object.defineProperty(window, n, { value: memoria(), configurable: true }); }
    catch (e) { window[n] = memoria(); }
  });
})();
</script>`;

export const esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Faz os formulários entregarem de verdade.
 *
 * O MVP gerado guarda o lead no navegador do visitante, o que equivale a jogar
 * fora. Aqui todo formulário sem destino próprio passa a apontar para a rota
 * de captura, por envio HTML comum.
 *
 * É POST de formulário, não fetch, de propósito: em origem opaca um fetch
 * seria requisição de outra origem e esbarraria em CORS, enquanto o envio
 * nativo funciona e ainda continua funcionando com o JavaScript desligado.
 */
function ligarFormularios(html, slug) {
  return html.replace(/<form\b([^>]*)>/gi, (todo, atributos) => {
    if (/\baction\s*=\s*["']?\s*(https?:|\/)/i.test(atributos)) return todo;  // já tem destino próprio
    const limpo = atributos
      .replace(/\s(action|method|enctype)\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, '')
      .trim();
    return `<form ${limpo} action="${PREFIXO}/${esc(slug)}/lead" method="POST" accept-charset="utf-8">`;
  });
}

/** Página final, com CSS e JS embutidos e os dois auxiliares injetados. */
export function montarPagina(arquivos, pagina, slug) {
  const ler = (nome) => arquivos.find(a => a.arquivo === nome)?.conteudo ?? '';

  let html = ler(pagina) || ler('index.html');
  if (!html) return null;

  html = html.replace(/<link[^>]+href=["']([^"']+\.css)["'][^>]*>/gi, (todo, arq) => {
    const css = ler(arq.replace(/^\.?\//, ''));
    return css ? `<style>\n${css}\n</style>` : todo;
  });

  html = html.replace(/<script[^>]+src=["']([^"']+\.js)["'][^>]*>\s*<\/script>/gi, (todo, arq) => {
    const js = ler(arq.replace(/^\.?\//, ''));
    return js ? `<script>\n${js}\n</script>` : todo;
  });

  // Links entre páginas do próprio site precisam do prefixo do endereço.
  html = html.replace(/(<a\b[^>]*\shref=)["'](?!https?:|mailto:|tel:|#|\/)([^"']+\.html)["']/gi,
    (todo, antes, destino) => `${antes}"${PREFIXO}/${esc(slug)}/${destino.replace(/^\.?\//, '')}"`);

  html = ligarFormularios(html, slug);

  html = html.includes('<head>')
    ? html.replace('<head>', `<head>\n${SUBSTITUTO_ARMAZENAMENTO}`)
    : SUBSTITUTO_ARMAZENAMENTO + html;

  return html;
}

/** Página de confirmação depois do envio, na linguagem da plataforma. */
export function paginaObrigado(nome) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Recebido</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#06140d;color:#dff6ec;font:16px/1.6 system-ui,-apple-system,sans-serif;padding:24px">
<div style="max-width:420px;text-align:center">
  <div style="font-size:40px;line-height:1">✓</div>
  <h1 style="font-size:22px;margin:14px 0 0">Recebemos seu contato</h1>
  <p style="color:#9fb8ad;margin:10px 0 0">Obrigado. ${esc(nome || 'A equipe')} vai responder no endereço que você deixou.</p>
  <p style="margin:26px 0 0"><a href="javascript:history.back()" style="color:#00ff64">voltar</a></p>
</div></body></html>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// LEADS
// ═══════════════════════════════════════════════════════════════════════════

const CAMPOS_EMAIL = ['email', 'e-mail', 'mail', 'endereco', 'endereço'];
const CAMPOS_NOME = ['nome', 'name', 'fullname', 'nome-completo'];

/** Reconhece nome e e-mail sem exigir que o agente tenha nomeado os campos. */
function interpretar(corpo) {
  const dados = {};
  let email = '';
  let nome = '';

  for (const [chave, valor] of Object.entries(corpo || {})) {
    const texto = String(Array.isArray(valor) ? valor.join(', ') : valor ?? '').slice(0, 2000);
    if (!texto.trim()) continue;
    const k = chave.toLowerCase();
    dados[chave.slice(0, 60)] = texto;
    if (!email && (CAMPOS_EMAIL.includes(k) || /@/.test(texto))) email = texto.trim();
    if (!nome && CAMPOS_NOME.includes(k)) nome = texto.trim();
  }
  return { dados, email, nome };
}

export async function registrarLead(slug, corpo, { ip } = {}) {
  const site = siteDoSlug(slug);
  if (!site) throw Object.assign(new Error('Site não encontrado.'), { status: 404 });

  const { dados, email, nome } = interpretar(corpo);
  if (!Object.keys(dados).length) {
    throw Object.assign(new Error('Formulário vazio.'), { status: 400 });
  }

  const conteudo = lerConteudo(site.proj.id);
  const lead = {
    id: `lead_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    em: new Date().toISOString(),
    nome, email, dados,
    // Só os dois primeiros octetos: dá para distinguir origem sem guardar de
    // onde a pessoa acessou.
    origem: String(ip || '').split('.').slice(0, 2).join('.') || null,
  };

  gravarConteudo(site.proj.id, { leads: [lead, ...(conteudo.leads || [])].slice(0, MAX_LEADS) });
  site.proj.site.leads = (site.proj.site.leads || 0) + 1;
  save();

  // O aviso é o que fecha o ciclo: sem ele o lead fica esperando alguém abrir
  // a plataforma, e um contato que espera dois dias já não é mais um contato.
  avisarDono(site.proj, lead).catch(e => console.error('lead: aviso falhou', e.message));

  return lead;
}

async function avisarDono(proj, lead) {
  const dono = store.users[proj.userId];
  if (!dono?.email) return;

  const linhas = Object.entries(lead.dados)
    .map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#7c8f84;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0;color:#dff6ec">${esc(v)}</td></tr>`)
    .join('');

  await enviar({
    para: dono.email,
    assunto: `Novo contato em ${proj.nome}`,
    html: `<!doctype html><html><body style="margin:0;background:#04140a;font-family:system-ui,-apple-system,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 14px">
  <table width="100%" style="max-width:520px;background:#0b1f16;border:1px solid rgba(0,229,255,.14)">
    <tr><td style="padding:26px 28px 0">
      <div style="font-size:11px;letter-spacing:.18em;color:#00e5ff;font-weight:700">ZOOMDEV OS</div>
      <h1 style="margin:12px 0 0;font-size:20px;color:#fff">Alguém preencheu o formulário de ${esc(proj.nome)}</h1>
    </td></tr>
    <tr><td style="padding:18px 28px 0">
      <table cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.6">${linhas}</table>
    </td></tr>
    ${lead.email ? `<tr><td style="padding:22px 28px 0">
      <a href="mailto:${esc(lead.email)}" style="display:inline-block;background:#00ff64;color:#04140a;font-weight:700;font-size:14px;padding:12px 24px;text-decoration:none">Responder agora</a>
    </td></tr>` : ''}
    <tr><td style="padding:24px 28px 28px">
      <div style="border-top:1px solid rgba(255,255,255,.08);padding-top:14px;font-size:11px;line-height:1.6;color:#7c8f84">
        Recebido pelo site que você publicou na ZoomDev OS. Todos os contatos ficam no Estúdio do projeto.
      </div>
    </td></tr>
  </table>
</td></tr></table></body></html>`,
    texto: `Novo contato em ${proj.nome}\n\n`
      + Object.entries(lead.dados).map(([k, v]) => `${k}: ${v}`).join('\n')
      + '\n\nTodos os contatos ficam no Estúdio do projeto.',
  });
}

export function leadsDe(projetoId) {
  return lerConteudo(projetoId).leads || [];
}
