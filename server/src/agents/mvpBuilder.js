// ═══════════════════════════════════════════════════════════════════════════
// MVP BUILDER — do plano de negócios ao produto navegável
//
// Pega o plano gerado pelos agentes e produz um MVP web REAL: arquivos que
// abrem no navegador, funcionam offline e podem ser publicados em qualquer
// hospedagem estática. Não é mockup — é código.
//
// Com API key: os agentes escrevem o código. Sem chave: um gerador
// determinístico monta o MVP a partir do conteúdo real do plano.
// ═══════════════════════════════════════════════════════════════════════════
import { config } from '../config.js';
import { structured } from './claude.js';

/** As peças que compõem o MVP, na ordem em que são construídas. */
export const PECAS = [
  { id: 'identidade', nome: 'Identidade visual', emoji: '🎨', arquivo: 'styles.css', papel: 'Paleta, tipografia e sistema de componentes' },
  { id: 'landing', nome: 'Landing page', emoji: '🚀', arquivo: 'index.html', papel: 'Proposta de valor, prova social e conversão' },
  { id: 'app', nome: 'Aplicação', emoji: '⚙️', arquivo: 'app.html', papel: 'Tela principal do produto, navegável' },
  { id: 'logica', nome: 'Lógica', emoji: '🧠', arquivo: 'app.js', papel: 'Interatividade, estado local e validações' },
  { id: 'entrega', nome: 'Entrega', emoji: '📦', arquivo: 'README.md', papel: 'Como rodar, publicar e evoluir' },
];

const esc = (t) => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ── Extração do plano ─────────────────────────────────────────────────────
function contexto(projeto) {
  const p = projeto.plano || {};
  const prod = p.produto || {};
  const neg = p.negocio || {};
  const eng = p.engenharia || {};
  const imp = p.impacto || {};
  return {
    nome: projeto.nome,
    descricao: projeto.descricao,
    bio: projeto.classificacao === 'biostartup',
    vertical: projeto.vertical || 'Inovação',
    proposta: prod.propostaValor || prod.proposta || projeto.descricao,
    publico: prod.publicoAlvo || prod.publico || 'primeiros usuários',
    dores: prod.dores || prod.problemas || [],
    funcionalidades: prod.funcionalidades || prod.features || [],
    diferencial: prod.diferencial || neg.diferencial || '',
    modelo: neg.modeloReceita || neg.modelo || 'Assinatura mensal',
    precos: neg.precos || neg.pricing || [],
    stack: eng.stack || eng.tecnologias || [],
    mvpEscopo: eng.escopoMvp || eng.mvp || [],
    impacto: imp.descricao || imp.teseImpacto || '',
    ods: imp.ods || [],
  };
}

const lista = (arr, fallback) => (Array.isArray(arr) && arr.length ? arr : fallback)
  .map(x => (typeof x === 'string' ? x : x?.titulo || x?.nome || JSON.stringify(x)));

// ── Gerador determinístico (modo demo — produz MVP real) ──────────────────
function gerarDemo(ctx) {
  const cor = ctx.bio ? '#00ff64' : '#00c8ff';
  const cor2 = ctx.bio ? '#00c8ff' : '#a855f7';
  const feats = lista(ctx.funcionalidades, ['Cadastro simples', 'Painel de acompanhamento', 'Relatórios exportáveis']).slice(0, 6);
  const dores = lista(ctx.dores, ['Processo manual e demorado', 'Falta de visibilidade dos dados', 'Custo alto de operação']).slice(0, 3);
  const escopo = lista(ctx.mvpEscopo, feats).slice(0, 5);
  const precos = Array.isArray(ctx.precos) && ctx.precos.length
    ? ctx.precos.slice(0, 3)
    : [
      { nome: 'Essencial', preco: 'R$ 49/mês', itens: ['Funcionalidades principais', 'Suporte por e-mail', '1 usuário'] },
      { nome: 'Profissional', preco: 'R$ 149/mês', itens: ['Tudo do Essencial', 'Relatórios avançados', 'Até 5 usuários'], destaque: true },
      { nome: 'Escala', preco: 'Sob consulta', itens: ['Tudo do Profissional', 'API e integrações', 'Usuários ilimitados'] },
    ];

  const styles = `/* ${ctx.nome} — sistema de design do MVP
   Gerado pela ZoomDev OS a partir do plano de negócios. */
:root{
  --brand:${cor}; --brand-2:${cor2};
  --bg:#0a0f0d; --surface:#111a15; --surface-2:#16211b;
  --text:#eaf5ee; --muted:#9db3a6; --border:#ffffff14;
  --radius:14px; --max:1140px;
}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--text);font-family:system-ui,-apple-system,'Segoe UI',sans-serif;line-height:1.65}
.wrap{max-width:var(--max);margin:0 auto;padding:0 24px}
a{color:inherit;text-decoration:none}

/* Navegação */
header{position:sticky;top:0;z-index:50;background:#0a0f0dd9;backdrop-filter:blur(12px);border-bottom:1px solid var(--border)}
nav{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 0}
.logo{font-weight:800;font-size:19px;letter-spacing:-.02em}
.logo span{background:linear-gradient(135deg,var(--brand),var(--brand-2));-webkit-background-clip:text;background-clip:text;color:transparent}
.nav-links{display:flex;gap:24px;font-size:14px;color:var(--muted)}
.nav-links a:hover{color:var(--text)}
@media(max-width:720px){.nav-links{display:none}}

/* Botões */
.btn{display:inline-block;padding:13px 26px;border-radius:10px;font-weight:700;font-size:14px;cursor:pointer;border:0;transition:transform .15s,filter .15s}
.btn:hover{transform:translateY(-1px);filter:brightness(1.08)}
.btn-primary{background:linear-gradient(135deg,var(--brand),var(--brand-2));color:#04140b}
.btn-ghost{border:1px solid var(--border);color:var(--text);background:transparent}

/* Hero */
.hero{padding:88px 0 72px;text-align:center;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 60% 50% at 50% 0%,${cor}1f,transparent);pointer-events:none}
.badge{display:inline-block;padding:6px 14px;border-radius:99px;border:1px solid ${cor}44;color:var(--brand);font-size:12px;font-weight:600;margin-bottom:22px}
h1{font-size:clamp(34px,5.5vw,58px);line-height:1.1;letter-spacing:-.03em;font-weight:800}
h1 em{font-style:normal;background:linear-gradient(135deg,var(--brand),var(--brand-2));-webkit-background-clip:text;background-clip:text;color:transparent}
.sub{color:var(--muted);font-size:18px;max-width:640px;margin:20px auto 32px}
.cta-row{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}

/* Seções */
section{padding:72px 0}
.section-title{font-size:clamp(26px,3.5vw,36px);font-weight:800;letter-spacing:-.02em;text-align:center}
.section-sub{color:var(--muted);text-align:center;margin-top:10px;margin-bottom:44px}

/* Grades */
.grid{display:grid;gap:18px}
.grid-3{grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:26px;transition:border-color .2s,transform .2s}
.card:hover{border-color:${cor}44;transform:translateY(-3px)}
.card h3{font-size:17px;margin-bottom:8px}
.card p{color:var(--muted);font-size:14px}
.icon{width:42px;height:42px;border-radius:11px;background:${cor}1a;border:1px solid ${cor}33;display:flex;align-items:center;justify-content:center;font-size:20px;margin-bottom:16px}

/* Preços */
.price-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:30px;display:flex;flex-direction:column}
.price-card.featured{border-color:var(--brand);box-shadow:0 0 0 1px ${cor}33,0 18px 50px ${cor}1a}
.price{font-size:34px;font-weight:800;margin:14px 0}
.price-card ul{list-style:none;margin:18px 0;flex:1}
.price-card li{padding:7px 0;color:var(--muted);font-size:14px;display:flex;gap:9px}
.price-card li::before{content:'✓';color:var(--brand);font-weight:800}

/* Formulário */
form{max-width:460px;margin:0 auto;display:flex;flex-direction:column;gap:12px}
input,textarea,select{background:var(--surface-2);border:1px solid var(--border);border-radius:10px;padding:13px 15px;color:var(--text);font-size:14px;font-family:inherit;width:100%}
input:focus,textarea:focus,select:focus{outline:0;border-color:var(--brand)}
label{font-size:13px;color:var(--muted)}
.msg{padding:13px;border-radius:10px;font-size:14px;display:none}
.msg.ok{background:${cor}1a;border:1px solid ${cor}44;color:var(--brand);display:block}

/* App */
.app-shell{display:grid;grid-template-columns:236px 1fr;min-height:100vh}
@media(max-width:860px){.app-shell{grid-template-columns:1fr}.sidebar{display:none}}
.sidebar{background:var(--surface);border-right:1px solid var(--border);padding:24px 0}
.sidebar a{display:flex;gap:11px;padding:12px 24px;color:var(--muted);font-size:14px;border-left:2px solid transparent}
.sidebar a.active,.sidebar a:hover{color:var(--text);background:${cor}0d;border-left-color:var(--brand)}
.main{padding:32px}
.stat-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:26px}
.stat{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px}
.stat .v{font-size:29px;font-weight:800;color:var(--brand)}
.stat .l{font-size:12px;color:var(--muted);margin-top:3px}
table{width:100%;border-collapse:collapse;font-size:14px}
th,td{text-align:left;padding:13px;border-bottom:1px solid var(--border)}
th{color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.05em}
.tag{display:inline-block;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600;background:${cor}1a;color:var(--brand)}

footer{border-top:1px solid var(--border);padding:36px 0;color:var(--muted);font-size:13px;text-align:center}
`;

  const nav = `  <header>
    <nav class="wrap">
      <a href="index.html" class="logo">${esc(ctx.nome.split(' ')[0])}<span>${esc(ctx.nome.split(' ').slice(1).join(' ') || '.')}</span></a>
      <div class="nav-links">
        <a href="#problema">Problema</a>
        <a href="#solucao">Solução</a>
        <a href="#precos">Preços</a>
        <a href="app.html">Ver o app</a>
      </div>
      <a href="#cadastro" class="btn btn-primary">Começar grátis</a>
    </nav>
  </header>`;

  const index = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(ctx.nome)} — ${esc(ctx.proposta).slice(0, 90)}</title>
<meta name="description" content="${esc(ctx.proposta).slice(0, 155)}">
<link rel="stylesheet" href="styles.css">
</head>
<body>
${nav}

<main>
  <div class="hero">
    <div class="wrap">
      <span class="badge">${ctx.bio ? '🌿 Bioeconomia' : '🚀'} ${esc(ctx.vertical)}</span>
      <h1>${esc(ctx.nome)}<br><em>${esc(ctx.proposta).slice(0, 78)}</em></h1>
      <p class="sub">${esc(ctx.descricao).slice(0, 220)}</p>
      <div class="cta-row">
        <a href="#cadastro" class="btn btn-primary">Quero testar</a>
        <a href="app.html" class="btn btn-ghost">Ver o produto →</a>
      </div>
    </div>
  </div>

  <section id="problema">
    <div class="wrap">
      <h2 class="section-title">O problema que resolvemos</h2>
      <p class="section-sub">Para ${esc(ctx.publico)}</p>
      <div class="grid grid-3">
${dores.map((d, i) => `        <div class="card">
          <div class="icon">${['⚠️', '⏳', '💸'][i] || '•'}</div>
          <h3>${esc(String(d).slice(0, 60))}</h3>
          <p>Hoje isso custa tempo e dinheiro — e não precisa ser assim.</p>
        </div>`).join('\n')}
      </div>
    </div>
  </section>

  <section id="solucao" style="background:var(--surface)">
    <div class="wrap">
      <h2 class="section-title">Como funciona</h2>
      <p class="section-sub">${esc(ctx.diferencial || 'Simples de começar, poderoso quando você cresce.')}</p>
      <div class="grid grid-3">
${feats.map((f, i) => `        <div class="card">
          <div class="icon">${['✨', '⚡', '📊', '🔒', '🔗', '🎯'][i] || '•'}</div>
          <h3>${esc(String(f).slice(0, 60))}</h3>
          <p>Disponível desde o primeiro dia, sem configuração complexa.</p>
        </div>`).join('\n')}
      </div>
    </div>
  </section>
${ctx.impacto ? `
  <section id="impacto">
    <div class="wrap" style="max-width:760px;text-align:center">
      <h2 class="section-title">Impacto</h2>
      <p class="sub">${esc(ctx.impacto).slice(0, 300)}</p>
      ${Array.isArray(ctx.ods) && ctx.ods.length ? `<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:18px">${ctx.ods.slice(0, 6).map(o => `<span class="tag">ODS ${esc(typeof o === 'object' ? o.numero || o.ods : o)}</span>`).join('')}</div>` : ''}
    </div>
  </section>` : ''}

  <section id="precos" style="background:var(--surface)">
    <div class="wrap">
      <h2 class="section-title">Planos</h2>
      <p class="section-sub">${esc(ctx.modelo)}</p>
      <div class="grid grid-3">
${precos.map(p => `        <div class="price-card${p.destaque ? ' featured' : ''}">
          <h3>${esc(p.nome || p.plano || 'Plano')}</h3>
          <div class="price">${esc(p.preco || p.valor || '—')}</div>
          <ul>${(p.itens || p.beneficios || ['Acesso completo']).map(i => `<li>${esc(i)}</li>`).join('')}</ul>
          <a href="#cadastro" class="btn ${p.destaque ? 'btn-primary' : 'btn-ghost'}">Escolher</a>
        </div>`).join('\n')}
      </div>
    </div>
  </section>

  <section id="cadastro">
    <div class="wrap">
      <h2 class="section-title">Entre na lista de espera</h2>
      <p class="section-sub">Os primeiros inscritos ajudam a definir o produto.</p>
      <form id="waitlist">
        <div><label for="nome">Nome</label><input id="nome" name="nome" required placeholder="Seu nome"></div>
        <div><label for="email">E-mail</label><input id="email" name="email" type="email" required placeholder="voce@email.com"></div>
        <div><label for="contexto">O que você mais precisa resolver?</label><textarea id="contexto" name="contexto" rows="3" placeholder="Conte em uma frase"></textarea></div>
        <button type="submit" class="btn btn-primary">Entrar na lista</button>
        <div class="msg" id="msg"></div>
      </form>
    </div>
  </section>
</main>

<footer>
  <div class="wrap">
    <p><strong>${esc(ctx.nome)}</strong> — ${esc(ctx.proposta).slice(0, 80)}</p>
    <p style="margin-top:8px;opacity:.6">MVP gerado pela ZoomDev OS a partir do plano de negócios.</p>
  </div>
</footer>

<script src="app.js"></script>
</body>
</html>`;

  const app = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(ctx.nome)} — Painel</title>
<link rel="stylesheet" href="styles.css">
</head>
<body>
<div class="app-shell">
  <aside class="sidebar">
    <div style="padding:0 24px 22px"><span class="logo">${esc(ctx.nome.split(' ')[0])}<span>${esc(ctx.nome.split(' ').slice(1).join(' ') || '.')}</span></span></div>
    <a href="#" class="active" data-view="painel">◈ Painel</a>
${escopo.map((e, i) => `    <a href="#" data-view="v${i}">${['📋', '📊', '⚙️', '🔗', '👥'][i] || '•'} ${esc(String(e).slice(0, 24))}</a>`).join('\n')}
    <a href="index.html">← Voltar ao site</a>
  </aside>

  <main class="main">
    <h1 style="font-size:24px;margin-bottom:6px">Painel</h1>
    <p style="color:var(--muted);font-size:14px;margin-bottom:26px">Visão geral de ${esc(ctx.nome)}</p>

    <div class="stat-row">
      <div class="stat"><div class="v" id="s1">0</div><div class="l">Registros</div></div>
      <div class="stat"><div class="v" id="s2">0</div><div class="l">Concluídos</div></div>
      <div class="stat"><div class="v" id="s3">0%</div><div class="l">Taxa de conclusão</div></div>
      <div class="stat"><div class="v" id="s4">—</div><div class="l">Último registro</div></div>
    </div>

    <div class="card" style="margin-bottom:22px">
      <h3 style="margin-bottom:14px">Novo registro</h3>
      <form id="novo" style="max-width:none">
        <div style="display:grid;grid-template-columns:2fr 1fr auto;gap:10px;align-items:end">
          <div><label for="titulo">Título</label><input id="titulo" required placeholder="O que você quer registrar?"></div>
          <div><label for="status">Status</label>
            <select id="status"><option value="aberto">Aberto</option><option value="andamento">Em andamento</option><option value="concluido">Concluído</option></select>
          </div>
          <button type="submit" class="btn btn-primary">Adicionar</button>
        </div>
      </form>
    </div>

    <div class="card">
      <h3 style="margin-bottom:14px">Registros</h3>
      <table>
        <thead><tr><th>Título</th><th>Status</th><th>Criado</th><th></th></tr></thead>
        <tbody id="tabela"><tr><td colspan="4" style="color:var(--muted)">Nenhum registro ainda. Adicione o primeiro acima.</td></tr></tbody>
      </table>
    </div>
  </main>
</div>
<script src="app.js"></script>
</body>
</html>`;

  const js = `/* ${ctx.nome} — lógica do MVP
   Estado em localStorage: funciona offline e sem backend.
   Para produção, troque as funções salvar/carregar por chamadas de API. */
(function () {
  'use strict';

  var CHAVE = '${ctx.nome.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-dados';

  function carregar() {
    try { return JSON.parse(localStorage.getItem(CHAVE)) || []; } catch (e) { return []; }
  }
  function salvar(dados) {
    localStorage.setItem(CHAVE, JSON.stringify(dados));
  }
  function dataBr(iso) {
    return new Date(iso).toLocaleDateString('pt-BR');
  }

  // ── Lista de espera (landing) ──
  var waitlist = document.getElementById('waitlist');
  if (waitlist) {
    waitlist.addEventListener('submit', function (e) {
      e.preventDefault();
      var leads = JSON.parse(localStorage.getItem(CHAVE + '-leads') || '[]');
      leads.push({
        nome: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        contexto: document.getElementById('contexto').value,
        em: new Date().toISOString()
      });
      localStorage.setItem(CHAVE + '-leads', JSON.stringify(leads));
      var msg = document.getElementById('msg');
      msg.className = 'msg ok';
      msg.textContent = 'Pronto! Você é o inscrito nº ' + leads.length + '. Entraremos em contato.';
      waitlist.reset();
    });
  }

  // ── Painel (app) ──
  var tabela = document.getElementById('tabela');
  if (!tabela) return;

  function render() {
    var dados = carregar();
    if (!dados.length) {
      tabela.innerHTML = '<tr><td colspan="4" style="color:var(--muted)">Nenhum registro ainda. Adicione o primeiro acima.</td></tr>';
    } else {
      tabela.innerHTML = dados.map(function (d, i) {
        return '<tr>' +
          '<td>' + d.titulo + '</td>' +
          '<td><span class="tag">' + d.status + '</span></td>' +
          '<td>' + dataBr(d.em) + '</td>' +
          '<td><button class="btn btn-ghost" style="padding:5px 12px;font-size:12px" data-remover="' + i + '">Remover</button></td>' +
          '</tr>';
      }).join('');
    }
    var concluidos = dados.filter(function (d) { return d.status === 'concluido'; }).length;
    document.getElementById('s1').textContent = dados.length;
    document.getElementById('s2').textContent = concluidos;
    document.getElementById('s3').textContent = dados.length ? Math.round(concluidos / dados.length * 100) + '%' : '0%';
    document.getElementById('s4').textContent = dados.length ? dataBr(dados[dados.length - 1].em) : '—';
  }

  document.getElementById('novo').addEventListener('submit', function (e) {
    e.preventDefault();
    var dados = carregar();
    dados.push({
      titulo: document.getElementById('titulo').value,
      status: document.getElementById('status').value,
      em: new Date().toISOString()
    });
    salvar(dados);
    e.target.reset();
    render();
  });

  tabela.addEventListener('click', function (e) {
    var i = e.target.getAttribute('data-remover');
    if (i === null) return;
    var dados = carregar();
    dados.splice(Number(i), 1);
    salvar(dados);
    render();
  });

  render();
})();`;

  const readme = `# ${ctx.nome}

${ctx.proposta}

> MVP gerado pela **ZoomDev OS** a partir do plano de negócios do projeto.

## Como rodar

Abra \`index.html\` no navegador. Não precisa instalar nada.

Para servir localmente com um servidor HTTP:

\`\`\`bash
npx serve .
# ou
python3 -m http.server 8000
\`\`\`

## Como publicar

Este MVP é 100% estático — publique em qualquer uma destas, de graça:

- **Netlify**: arraste a pasta em app.netlify.com/drop
- **Vercel**: \`npx vercel\`
- **GitHub Pages**: suba os arquivos e ative Pages nas configurações
- **Cloudflare Pages**: conecte o repositório

## Estrutura

\`\`\`
index.html    landing page com proposta de valor e captura de leads
app.html      painel do produto, navegável
styles.css    sistema de design (cores, tipografia, componentes)
app.js        lógica: estado em localStorage, sem backend
\`\`\`

## Os dados

Tudo é salvo em \`localStorage\` — funciona offline e sem servidor. É o
suficiente para validar com usuários reais.

**Quando precisar de backend**, troque as funções \`carregar()\` e \`salvar()\`
em \`app.js\` por chamadas à sua API. O resto da interface não muda.

## Escopo desta versão

${escopo.map(e => `- ${e}`).join('\n')}

## Próximos passos

1. Publique e mande o link para 10 pessoas do seu público-alvo
2. Meça quantas se cadastram na lista de espera
3. Converse com quem se cadastrou antes de escrever mais código
4. Só então decida o que construir a seguir

---

**Modelo de receita:** ${ctx.modelo}
**Público-alvo:** ${ctx.publico}
${ctx.stack.length ? `**Stack sugerida para a v2:** ${lista(ctx.stack, []).join(', ')}` : ''}
`;

  return {
    identidade: { arquivo: 'styles.css', conteudo: styles },
    landing: { arquivo: 'index.html', conteudo: index },
    app: { arquivo: 'app.html', conteudo: app },
    logica: { arquivo: 'app.js', conteudo: js },
    entrega: { arquivo: 'README.md', conteudo: readme },
  };
}

// ── Geração por IA ────────────────────────────────────────────────────────
const ARQUIVO_SCHEMA = {
  type: 'object',
  properties: { conteudo: { type: 'string' } },
  required: ['conteudo'],
  additionalProperties: false,
};

async function gerarPecaIA(peca, ctx, jaGerado) {
  const base = `PROJETO: ${ctx.nome} (${ctx.bio ? 'biostartup' : 'startup'}, ${ctx.vertical})
PROPOSTA DE VALOR: ${ctx.proposta}
PÚBLICO: ${ctx.publico}
DORES: ${lista(ctx.dores, ['—']).join(' · ')}
FUNCIONALIDADES: ${lista(ctx.funcionalidades, ['—']).join(' · ')}
MODELO DE RECEITA: ${ctx.modelo}
ESCOPO DO MVP: ${lista(ctx.mvpEscopo, ['—']).join(' · ')}
${ctx.impacto ? `IMPACTO: ${ctx.impacto}` : ''}`;

  const instrucoes = {
    identidade: 'Escreva o arquivo styles.css completo: variáveis CSS, reset, tipografia, botões, cards, grid responsivo, formulários, tabela e um shell de aplicação com sidebar. Tema escuro, moderno, com uma cor de marca coerente com o setor. Sem frameworks, sem imports externos.',
    landing: 'Escreva o index.html completo: header fixo, hero com proposta de valor, seção de problema, seção de solução com as funcionalidades, seção de preços, formulário de lista de espera e footer. Use as classes do styles.css. HTML semântico e acessível.',
    app: 'Escreva o app.html completo: shell com sidebar de navegação, cabeçalho, linha de cards de métricas, formulário de criação e tabela de registros. Deve parecer o produto real descrito no plano.',
    logica: 'Escreva o app.js completo em JavaScript puro (sem frameworks): captura do formulário da landing, CRUD de registros no localStorage, cálculo das métricas e renderização da tabela. Código limpo, comentado em pt-BR, IIFE, sem dependências.',
    entrega: 'Escreva o README.md: o que é, como rodar, como publicar (Netlify/Vercel/GitHub Pages), estrutura dos arquivos, onde trocar localStorage por API, escopo desta versão e próximos passos de validação.',
  };

  const r = await structured({
    system: `Você é o Dev Master da ZoomDev OS, engenheiro de produto sênior. Você escreve MVPs que FUNCIONAM: código real, sem placeholder, sem "TODO", sem dependência externa. O usuário vai abrir o arquivo no navegador e usar.
Regras: HTML/CSS/JS puro, sem CDN, sem framework, sem import externo. Responsivo. Tema escuro. Texto da interface em pt-BR.
Retorne APENAS o conteúdo do arquivo, sem cercas de markdown e sem explicação.`,
    user: `${base}

ARQUIVO A ESCREVER: ${peca.arquivo}
${instrucoes[peca.id]}
${jaGerado.identidade ? `\nO styles.css já foi escrito e define estas classes — REUTILIZE-AS, não invente novas:\n${jaGerado.identidade.conteudo.match(/^\.[a-z-]+/gm)?.slice(0, 40).join(' ') || ''}` : ''}`,
    schema: ARQUIVO_SCHEMA,
    effort: 'medium',
    maxTokens: 16000,
  });
  return { arquivo: peca.arquivo, conteudo: r.conteudo };
}

/**
 * Constrói o MVP. `onProgress(pecaId, status, arquivo)` reporta o andamento.
 * Retorna { arquivos: [{arquivo, conteudo}], modo }.
 */
export async function construirMvp(projeto, onProgress = () => {}) {
  const ctx = contexto(projeto);
  const demo = gerarDemo(ctx);

  if (!config.hasApiKey) {
    for (const p of PECAS) {
      onProgress(p.id, 'concluido', demo[p.id].arquivo);
    }
    return { arquivos: PECAS.map(p => demo[p.id]), modo: 'demo' };
  }

  const gerado = {};
  for (const p of PECAS) {
    onProgress(p.id, 'executando', p.arquivo);
    try {
      gerado[p.id] = await gerarPecaIA(p, ctx, gerado);
      onProgress(p.id, 'concluido', p.arquivo);
    } catch (e) {
      // Falha em uma peça não derruba o MVP: entra a versão determinística
      gerado[p.id] = demo[p.id];
      onProgress(p.id, 'fallback', p.arquivo);
    }
  }
  return { arquivos: PECAS.map(p => gerado[p.id]), modo: 'ia' };
}
