import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../App.jsx';
import { api, setToken } from '../lib/api.js';
import { FocoContext, avisarChassi } from '../lib/foco.js';
import { aplicar as aplicarTema, gravarLocal as gravarTema, lerLocal as lerTema } from '../lib/tema.js';
import BrandLockup from './BrandLockup.jsx';
import Logo from './Logo.jsx';
import Copiloto from './Copiloto.jsx';
import Paleta from './Paleta.jsx';
import Icon from './Icon.jsx';
import { ACENTO, MARCA, Painel, Etiqueta, Pulso } from './hud/index.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// LAYOUT — o chassi da aplicação na linguagem HUD.
//
// Três formatos, um componente:
//
//   CELULAR   barra lateral vira gaveta sobre o conteúdo, aberta pelo botão
//             de menu no topo. Conteúdo ocupa a largura inteira.
//   TABLET    barra lateral já visível, mas recolhida por padrão: só ícones,
//             porque 768px não sobra para 240px de menu fixo.
//   DESKTOP   barra lateral aberta, recolhível pelo botão no rodapé dela.
//
// A escolha de recolher fica em localStorage: quem gosta do modo compacto não
// precisa reajustar a cada visita.
// ═══════════════════════════════════════════════════════════════════════════

// Impacto, Compensação e CarbonPay eram três itens soltos no mesmo nível de
// Bioeconomia, e os três só existem por causa dela: medir impacto, compensar o
// passivo e pagar a compensação são etapas de uma trilha só. Agrupá-los reduz
// o menu de onze para oito linhas e conta a hierarquia real do produto.
// A navegação conta a história da plataforma em quatro domínios: CONSTRUIR
// (da ideia ao produto), REGENERAR (o território e o impacto), PROVAR (a
// evidência e o dinheiro que ela destrava) e CRESCER (edital e investidor).
// Domínio é rótulo, não destino: quem navega vai direto ao módulo.
const MENU = [
  { to: '/', icone: 'home', label: 'Home' },
  {
    to: 'g-construir', grupo: true, label: 'Construir',
    filhos: [
      { to: '/dashboard', icone: 'grid', label: 'Dashboard' },
      { to: '/ideacao', icone: 'raio', label: 'Ideação' },
      { to: '/projetos', icone: 'pasta', label: 'Projetos' },
      { to: '/strategy', icone: 'cpu', label: 'Strategy Core', selo: 'IA' },
      { to: '/agentes', icone: 'bot', label: 'Agentes' },
    ],
  },
  {
    to: 'g-regenerar', grupo: true, label: 'Regenerar',
    filhos: [
      { to: '/territorio', icone: 'mapa', label: 'Território', selo: 'GEO' },
      { to: '/impacto', icone: 'globo', label: 'Impacto 360°', selo: 'ODS' },
      { to: '/compensacao', icone: 'balanca', label: 'Compensação' },
      { to: '/mundo', icone: 'cubo', label: 'Vale ZoomDev', selo: '3D' },
    ],
  },
  {
    to: 'g-provar', grupo: true, label: 'Provar',
    filhos: [
      { to: '/evidencias', icone: 'escudo', label: 'Sala de Evidência' },
      { to: '/carbonpay', icone: 'moeda', label: 'CarbonPay', selo: 'FIN' },
    ],
  },
  {
    to: 'g-crescer', grupo: true, label: 'Crescer',
    filhos: [
      { to: '/editais', icone: 'documento', label: 'Editais' },
      { to: '/investidores', icone: 'trofeu', label: 'Investidores' },
    ],
  },
  {
    to: 'g-sistema', grupo: true, label: 'Sistema',
    filhos: [
      { to: '/malha', icone: 'transmissao', label: 'Malha do Ecossistema' },
    ],
  },
  { to: '/configuracoes', icone: 'engrenagem', label: 'Configurações' },
];

const GRUPOS_PADRAO = MENU.filter(m => m.grupo).map(m => m.to);

// O cardápio da paleta ⌘K: a navegação inteira mais as ações que valem um
// atalho. `apelidos` são os outros nomes pelos quais alguém procuraria.
//
// Uma entrada com o MESMO rótulo de um item do menu não vira linha nova: ela
// empresta os apelidos para a linha que já existe. Sem isto, "Malha do
// Ecossistema" aparecia duas vezes na paleta, idênticas, e a pessoa ficava
// escolhendo entre dois itens iguais sem saber qual a diferença.
const EXTRAS_PALETA = [
  { rotulo: 'Registrar evidência', para: '/evidencias', dominio: 'Provar', apelidos: 'laudo foto prova lacrar cadeia custodia' },
  { rotulo: 'Verificar cadeia de custódia', para: '/evidencias', dominio: 'Provar', apelidos: 'hash integridade' },
  { rotulo: 'Passaporte público do hectare', para: '/p/AP-0042', dominio: 'Provar', apelidos: 'qr lote publico' },
  { rotulo: 'Simular impacto de nova área', para: '/impacto', dominio: 'Regenerar', apelidos: '360 simulacao carbono alimento' },
  { rotulo: 'Estruturar uma ideia nova', para: '/ideacao', dominio: 'Construir', apelidos: 'criar startup comecar' },
  { rotulo: 'Planos e assinatura', para: '/planos', apelidos: 'preco upgrade pro business seiva' },
  { rotulo: 'Malha do Ecossistema', para: '/malha', dominio: 'Sistema', apelidos: 'barramento conectores eventos diagnostico' },
];

const ACOES_PALETA = (() => {
  const linhas = MENU.flatMap(m => (m.grupo
    ? m.filhos.map(f => ({ rotulo: f.label, para: f.to, dominio: m.label }))
    : [{ rotulo: m.label, para: m.to }]));
  const porChave = new Map(linhas.map(l => [`${l.rotulo}|${l.para}`, l]));
  for (const extra of EXTRAS_PALETA) {
    const chave = `${extra.rotulo}|${extra.para}`;
    const existente = porChave.get(chave);
    if (existente) {
      existente.apelidos = [existente.apelidos, extra.apelidos].filter(Boolean).join(' ');
    } else {
      porChave.set(chave, extra);
      linhas.push(extra);
    }
  }
  return linhas;
})();

// v2: a chave versionada zera o estado salvo da navegação antiga, senão quem
// já usava a plataforma veria os quatro domínios novos nascerem fechados.
const CHAVE_ABERTOS = 'zd_menu_abertos_v2';

const TABS = [
  { to: '/', label: 'Home' },
  { to: '/dashboard', label: 'Plataforma' },
  { to: '/agentes', label: 'Agentes' },
  { to: '/projetos', label: 'Projetos' },
  { to: '/bioeconomia', label: 'Bio Startups' },
  { to: '/impacto', label: 'Impacto 360°' },
  { to: '/editais', label: 'Editais' },
  { to: '/investidores', label: 'Investidores' },
  { to: '/carbonpay', label: 'CarbonPay' },
];

const CORTE_ABA = 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)';
const CHAVE_RECOLHIDO = 'zd_menu_recolhido';

export default function Layout({ children }) {
  const { user, setUser } = useUser();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [notifAbertas, setNotifAbertas] = useState(false);
  const [notificacoes, setNotificacoes] = useState([]);
  const [menuMovel, setMenuMovel] = useState(false);
  const [paletaAberta, setPaletaAberta] = useState(false);

  // ⌘K (ou Ctrl+K) abre a paleta de qualquer tela; apertar de novo fecha.
  useEffect(() => {
    const atalho = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletaAberta(v => !v);
      }
    };
    document.addEventListener('keydown', atalho);
    return () => document.removeEventListener('keydown', atalho);
  }, []);
  // A PREFERÊNCIA da pessoa sobre o menu. Só muda quando ela clica no botão, e
  // só ela é gravada. O modo foco recolhe a barra sem tocar aqui: durante meses
  // o foco escrevia "recolhido" na preferência, e quem visitasse o Território
  // uma vez encontrava o menu recolhido para sempre, em toda tela e em toda
  // sessão, sem entender o motivo.
  const [preferenciaMenu, setPreferenciaMenu] = useState(() => {
    const salvo = localStorage.getItem(CHAVE_RECOLHIDO);
    // Sem preferência salva, tablet começa recolhido e desktop começa aberto.
    if (salvo === null) return window.innerWidth < 1100;
    return salvo === '1';
  });
  const notifRef = useRef(null);

  // ── Grupos do menu ───────────────────────────────────────────────────────
  // O que está aberto fica guardado, e o grupo que contém a rota atual abre
  // sozinho: chegar em Compensação por link direto e encontrar o menu fechado
  // esconderia de onde aquela tela veio.
  // Os quatro domínios nascem abertos: menu novo fechado é menu invisível.
  const [abertos, setAbertos] = useState(() => {
    try {
      const salvo = localStorage.getItem(CHAVE_ABERTOS);
      return salvo ? JSON.parse(salvo) : GRUPOS_PADRAO;
    } catch { return GRUPOS_PADRAO; }
  });
  const alternarGrupo = (chave) => setAbertos(a => {
    const novo = a.includes(chave) ? a.filter(x => x !== chave) : [...a, chave];
    try { localStorage.setItem(CHAVE_ABERTOS, JSON.stringify(novo)); } catch { /* modo privado */ }
    return novo;
  });

  // Silenciador à vista. Som que só pode ser desligado dentro das
  // configurações é som que a pessoa desliga fechando a aba.
  const [somLigado, setSomLigado] = useState(() => lerTema().som);
  const alternarSom = () => {
    const t = { ...lerTema(), som: !somLigado };
    gravarTema(t);
    aplicarTema(t);
    setSomLigado(t.som);
  };

  // ── Modo foco ────────────────────────────────────────────────────────────
  // `pedido` vem da tela, `dispensado` vem da pessoa. O foco só vale quando a
  // tela pede e ninguém dispensou, e dispensar não desmonta nada: é só o
  // chassi voltando.
  const [pedido, setPedido] = useState(false);
  const [dispensado, setDispensado] = useState(false);
  const [topoAberto, setTopoAberto] = useState(false);
  // Estado do menu ENQUANTO o foco está ligado: nasce recolhido a cada entrada
  // e é descartado na saída. Quem quiser o menu aberto dentro do Território
  // abre, e isso vale só ali.
  const [recolhidoNoFoco, setRecolhidoNoFoco] = useState(true);

  // No celular o foco não vale: lá o cabeçalho carrega o botão que abre o
  // menu, e a barra lateral já é uma gaveta escondida. Recolher os dois
  // deixaria a pessoa numa tela sem saída aparente.
  const [estreito, setEstreito] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768,
  );
  useEffect(() => {
    const medir = () => setEstreito(window.innerWidth < 768);
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, []);

  const foco = pedido && !dispensado && !estreito;

  const pedirFoco = useCallback((quer) => {
    setPedido(quer);
    if (quer) setDispensado(false);
  }, []);

  // O menu efetivo: no foco vale o estado temporário, fora dele vale a
  // preferência. Duas variáveis em vez de uma são o que impede o foco de
  // sequestrar a escolha da pessoa.
  const recolhido = foco ? recolhidoNoFoco : preferenciaMenu;
  const alternarMenu = () => (foco ? setRecolhidoNoFoco(v => !v) : setPreferenciaMenu(v => !v));

  // Cada entrada no foco começa com o chassi recolhido.
  useEffect(() => {
    if (foco) setRecolhidoNoFoco(true);
    setTopoAberto(false);
  }, [foco]);

  // O cabeçalho encolhe sem que a janela mude de tamanho, então quem mede a
  // própria altura precisa ser avisado, na entrada e no fim da transição.
  useEffect(() => {
    avisarChassi();
    const t = setTimeout(avisarChassi, 380);
    return () => clearTimeout(t);
  }, [foco, topoAberto, recolhido]);

  useEffect(() => {
    if (!foco) return undefined;
    const tecla = (e) => { if (e.key === 'Escape') setDispensado(true); };
    document.addEventListener('keydown', tecla);
    return () => document.removeEventListener('keydown', tecla);
  }, [foco]);

  const contextoFoco = useMemo(() => ({ foco, pedirFoco }), [foco, pedirFoco]);

  const capacidades = user.capacidades || [];
  const podeAbrirPainel = capacidades.includes('usuarios.ler') || capacidades.includes('comunidade.curar');

  const itens = [
    ...MENU,
    ...(podeAbrirPainel ? [{ to: '/painel', icone: 'escudo', label: 'Administração', selo: 'PAINEL' }] : []),
    ...(user.isAdmin ? [
      { to: '/admin', icone: 'visor', label: 'Sexta-Feira', selo: 'ADMIN' },
      { to: '/estilo', icone: 'grid', label: 'Guia de estilo' },
    ] : []),
  ];

  useEffect(() => { api.notificacoes().then(setNotificacoes).catch(() => {}); }, []);
  useEffect(() => { localStorage.setItem(CHAVE_RECOLHIDO, preferenciaMenu ? '1' : '0'); }, [preferenciaMenu]);
  useEffect(() => {
    const fechar = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifAbertas(false); };
    document.addEventListener('mousedown', fechar);
    return () => document.removeEventListener('mousedown', fechar);
  }, []);
  // Rota trocada fecha a gaveta: no celular ela cobre a tela inteira.
  useEffect(() => { setMenuMovel(false); }, [children]);

  // Grupo que contém a rota atual abre sozinho, sem sobrescrever o que a
  // pessoa abriu à mão.
  useEffect(() => {
    const dono = MENU.find(m => m.filhos?.some(f => f.to === pathname));
    if (dono) setAbertos(a => (a.includes(dono.to) ? a : [...a, dono.to]));
  }, [pathname]);

  const sair = () => { setToken(null); setUser(null); nav('/'); };

  // Uma linha do menu, com ou sem recuo de filho.
  const linha = (m, { compacto, filho = false }) => (
    <NavLink key={m.to} to={m.to} end={m.to === '/'}
      onClick={() => setMenuMovel(false)}
      title={compacto ? m.label : undefined}
      className={({ isActive }) => `zd-menu-item flex items-center gap-3 text-[13px] font-medium ${
        filho ? 'py-2 text-[12.5px]' : 'py-2.5'} ${
        compacto ? 'px-0 justify-center' : filho ? 'pl-9 pr-5' : 'px-5'} ${isActive ? 'active' : ''}`}>
      {({ isActive }) => (
        <>
          <Icon nome={m.icone} tam={compacto ? 19 : filho ? 15 : 17}
            className={isActive ? '' : 'opacity-60'} />
          {!compacto && (
            <>
              <span className="flex-1 truncate">{m.label}</span>
              {m.selo && (
                <Etiqueta cor={isActive ? MARCA : ACENTO} className="!text-[8px] !py-0.5 !px-1.5">
                  {m.selo}
                </Etiqueta>
              )}
            </>
          )}
        </>
      )}
    </NavLink>
  );

  // `compacto` vale só na barra fixa; a gaveta do celular é sempre completa.
  //
  // Na régua de ícones não existe recuo que signifique alguma coisa, então os
  // filhos aparecem sempre, ligados ao pai por um fio à esquerda. Esconder um
  // grupo inteiro atrás de um clique num menu de 68 px seria trocar duas
  // linhas de economia por três destinos invisíveis.
  const navegacao = (compacto) => (
    <nav className="flex-1 mt-1 overflow-y-auto overflow-x-hidden">
      {itens.map(m => {
        if (!m.filhos) return linha(m, { compacto });
        const aberto = compacto || abertos.includes(m.to);
        // Domínio: rótulo técnico que agrupa, sem ser destino. Na régua
        // compacta ele some e os módulos ficam, porque ícone não precisa de
        // capítulo para ser encontrado.
        return (
          <div key={m.to} className="relative">
            {!compacto && (
              <button
                onClick={() => alternarGrupo(m.to)}
                aria-expanded={aberto}
                className="w-full flex items-center gap-2 px-5 pt-4 pb-1 text-left group">
                <span className="text-[8.5px] tracking-[.26em] font-mono uppercase text-white/35 group-hover:text-white/60 transition-colors">
                  {m.label}
                </span>
                <span className="flex-1 h-px bg-white/8" />
                <Icon nome="chevron" tam={11}
                  className={`text-white/30 transition-transform duration-300 ${aberto ? '' : '-rotate-90'}`} />
              </button>
            )}
            <div className="zd-submenu" data-aberto={aberto ? 'sim' : 'nao'}>
              <div>
                {m.filhos.map(f => linha(f, { compacto }))}
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );

  const rodape = (compacto) => (
    <div className={`border-t border-white/5 ${compacto ? 'p-2' : 'p-4'}`}>
      {compacto ? (
        <img src="/assets/agents/faces/maia.webp" alt="Maiá" title="Maiá · Inteligência Regenerativa"
          className="w-9 h-9 object-cover object-center mx-auto hud-corte"
          style={{ '--c': '6px', boxShadow: '0 0 12px color-mix(in srgb, var(--zd-marca) 25%, transparent)' }} />
      ) : (
        <Painel tamanho="p" className="p-3 flex items-center gap-3">
          <img src="/assets/agents/faces/maia.webp" alt="Maiá"
            className="w-10 h-10 object-cover object-center shrink-0 hud-corte"
            style={{ '--c': '7px', boxShadow: '0 0 14px color-mix(in srgb, var(--zd-marca) 25%, transparent)' }} />
          <div className="min-w-0">
            <div className="text-xs font-bold truncate">Maiá</div>
            <div className="hud-tec text-[8.5px] text-white/35">INTELIGÊNCIA REGENERATIVA</div>
            <div className="text-[10px] zd-green flex items-center gap-1.5 mt-1">
              <Pulso /> em campo
            </div>
          </div>
        </Painel>
      )}

      {/* Botão de recolher: só existe na barra fixa, não na gaveta do celular */}
      {compacto !== null && (
        <button
          onClick={alternarMenu}
          title={recolhido ? 'Expandir menu' : 'Recolher menu'}
          aria-label={recolhido ? 'Expandir menu' : 'Recolher menu'}
          aria-expanded={!recolhido}
          className={`hidden md:flex items-center gap-2 w-full mt-3 py-2 text-[11px] text-white/40 hover:text-[color:var(--zd-acento)] hover:bg-white/[.04] transition-colors ${
            compacto ? 'justify-center' : 'px-3'}`}
        >
          <Icon nome="chevron" tam={15} className={recolhido ? '-rotate-90' : 'rotate-90'} />
          {!compacto && <span className="hud-caps">Recolher menu</span>}
        </button>
      )}

      {!compacto && <div className="hud-tec text-[9px] text-white/20 mt-2">© 2026 ZOOMDEV OS</div>}
    </div>
  );

  return (
    <FocoContext.Provider value={contextoFoco}>
    <div className="min-h-screen md:h-screen md:overflow-hidden zd-bg zd-circuit-bg hud-grade hud-scan flex" data-foco={foco ? 'sim' : 'nao'}>
      {/* Barra fixa: tablet e desktop */}
      <aside className={`zd-sidebar shrink-0 hidden md:flex flex-col relative z-10 transition-[width] duration-300 ${
        recolhido ? 'w-[68px]' : 'w-60'}`}>
        <div className={`py-6 ${recolhido ? 'px-2 flex justify-center' : 'px-4'}`}>
          {recolhido ? <Logo className="w-9 h-9" /> : <BrandLockup symbolSize={38} wordmarkHeight={30} />}
        </div>
        {navegacao(recolhido)}
        {rodape(recolhido)}
      </aside>

      {/* Gaveta: celular */}
      {menuMovel && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setMenuMovel(false)}>
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
          <aside className="zd-sidebar w-[min(78vw,17rem)] h-full flex flex-col relative"
            onClick={e => e.stopPropagation()}>
            <div className="px-4 py-5 flex items-center justify-between">
              <BrandLockup symbolSize={30} wordmarkHeight={24} />
              <button onClick={() => setMenuMovel(false)} aria-label="Fechar menu"
                className="text-white/40 hover:text-white p-2 -mr-2">
                <Icon nome="fechar" tam={18} />
              </button>
            </div>
            {navegacao(false)}
            {rodape(null)}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 md:min-h-0 relative z-10">
        {/* No modo foco o cabeçalho sobe e some. A faixa fina que sobra o traz
            de volta ao encostar o mouse, e no toque ela é o alvo do dedo. */}
        {foco && !topoAberto && (
          <button className="zd-puxador" title="Mostrar a barra superior"
            aria-label="Mostrar a barra superior"
            onMouseEnter={() => setTopoAberto(true)}
            onClick={() => setTopoAberto(true)}>
            <span />
          </button>
        )}

        <div className="zd-topo" data-recolhido={foco && !topoAberto ? 'sim' : 'nao'}
          onMouseLeave={() => { if (foco) setTopoAberto(false); }}>
        <header className="border-b" style={{ borderColor: 'color-mix(in srgb, var(--zd-acento) 12%, transparent)' }}>
          <div className="flex items-center justify-between gap-2 md:gap-4 px-3 sm:px-4 md:px-5 py-2.5 md:py-3">
            <div className="flex items-center gap-2 md:hidden min-w-0">
              <button onClick={() => setMenuMovel(true)} aria-label="Abrir menu"
                className="text-white/60 hover:text-white p-2 -ml-2 shrink-0">
                <Icon nome="lista" tam={20} />
              </button>
              {/* Abaixo de 420px o wordmark disputa espaço com as etiquetas de
                  estado e as duas se sobrepõem: aí fica só o símbolo. */}
              <span className="hidden min-[420px]:block"><BrandLockup symbolSize={24} wordmarkHeight={18} /></span>
              <span className="min-[420px]:hidden"><Logo className="w-7 h-7" /></span>
            </div>

            <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 min-w-0 overflow-x-auto">
              {TABS.map(t => (
                <NavLink key={t.to} to={t.to} end={t.to === '/'}
                  className={({ isActive }) => `px-2 xl:px-2.5 py-1.5 text-[10px] xl:text-[11px] font-semibold uppercase tracking-[.04em] whitespace-nowrap transition-colors ${
                    isActive ? 'zd-aba-topo-ativa' : 'text-white/40 hover:text-white/85 hover:bg-white/5'}`}
                  style={({ isActive }) => (isActive ? { clipPath: CORTE_ABA } : undefined)}>
                  {t.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button onClick={() => setPaletaAberta(true)} title="Paleta de comando (⌘K)"
                className="hidden lg:flex items-center gap-1.5 rounded-lg border border-white/12 hover:border-[color:var(--zd-acento)]/50 px-2.5 py-1 text-[10px] font-mono text-white/45 hover:text-white/80 transition-colors">
                ⌘K <span className="tracking-wider">BUSCAR OU AGIR</span>
              </button>
              <Etiqueta cor={MARCA} title="Seiva: seus créditos de IA">
                <Icon nome="seiva" tam={11} /> {user.creditos}
              </Etiqueta>
              <Etiqueta cor={ACENTO}
                title={user.nivel.proximoXp
                  ? `XP ${user.nivel.xp} · faltam ${user.nivel.proximoXp - user.nivel.xp} para o nível ${user.nivel.nivel + 1}`
                  : `XP ${user.nivel.xp} · nível máximo`}
                className="hidden md:inline-flex items-center">
                NV {user.nivel.nivel} · {user.nivel.nome}
                <span className="zd-nivel-trilha ml-1.5">
                  <i style={{ width: `${Math.round((user.nivel.progresso ?? 0) * 100)}%` }} />
                </span>
              </Etiqueta>
              {user.gamification.streak?.dias > 1 && (
                <Etiqueta cor="#ffc531" title="Sequência de dias construindo" className="hidden xl:inline-flex">
                  <Icon nome="chama" tam={11} /> {user.gamification.streak.dias}d
                </Etiqueta>
              )}

              <div className="relative" ref={notifRef}>
                <button onClick={() => setNotifAbertas(v => !v)} aria-label="Notificações"
                  className="relative text-white/45 hover:text-[color:var(--zd-acento)] transition-colors p-2">
                  <Icon nome="transmissao" tam={18} />
                  {notificacoes.length > 0 && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5"
                      style={{ background: 'var(--zd-marca)', transform: 'rotate(45deg)' }}
                      />
                  )}
                </button>
                {notifAbertas && (
                  <Painel aceso className="absolute right-0 mt-3 w-[min(20rem,calc(100vw-1.5rem))] p-2 z-40">
                    <div className="hud-caps text-[9px] text-white/40 px-2 py-1.5">Notificações</div>
                    {notificacoes.map(n => (
                      <div key={n.id} className="zd-notification px-3 py-2.5 mb-1.5">
                        <div className="text-xs font-semibold">{n.titulo}</div>
                        <div className="text-[11px] text-white/55 mt-0.5">{n.detalhe}</div>
                      </div>
                    ))}
                  </Painel>
                )}
              </div>

              <button onClick={alternarSom} aria-pressed={somLigado}
                title={somLigado ? 'Silenciar a interface' : 'Ligar o retorno sonoro'}
                aria-label={somLigado ? 'Silenciar a interface' : 'Ligar o retorno sonoro'}
                className={`transition-colors p-2 ${somLigado
                  ? 'text-white/45 hover:text-[color:var(--zd-acento)]'
                  : 'text-white/20 hover:text-white/50'}`}>
                <Icon nome={somLigado ? 'som' : 'semSom'} tam={17} />
              </button>

              <button onClick={sair} title="Sair" aria-label="Sair"
                className="text-white/35 hover:text-[#ff4d8d] transition-colors p-2">
                <Icon nome="cadeadoAberto" tam={17} />
              </button>
            </div>
          </div>
        </header>
        </div>

        {/* A chave por caminho reinicia a animação a cada rota: sem ela o
            React reaproveita o nó e a tela nova aparece seca. */}
        <main className={`flex-1 overflow-x-hidden md:min-h-0 md:overflow-y-auto ${
          foco ? 'p-2 md:p-3' : 'p-3 sm:p-4 md:p-6 lg:p-8'}`}>
          <div key={pathname} className="zd-entra h-full">{children}</div>
        </main>
      </div>

      {/* Saída do modo foco. Fica no canto, discreta, porque o ponto do modo é
          justamente não ter nada disputando a tela. */}
      {foco && (
        <button onClick={() => setDispensado(true)}
          title="Sair do modo foco (Esc)" aria-label="Sair do modo foco"
          className="hud-botao-vazio fixed top-1.5 right-2 z-30 px-2.5 py-1 text-[9px] hud-caps
                     flex items-center gap-1.5 opacity-35 hover:opacity-100 transition-opacity">
          <Icon nome="fechar" tam={12} /> foco
        </button>
      )}

      <Copiloto />
      <Paleta aberta={paletaAberta} fechar={() => setPaletaAberta(false)} acoes={ACOES_PALETA} />
    </div>
    </FocoContext.Provider>
  );
}
