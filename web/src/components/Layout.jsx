import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useUser } from '../App.jsx';
import { api, setToken } from '../lib/api.js';
import BrandLockup from './BrandLockup.jsx';
import Copiloto from './Copiloto.jsx';
import Icon from './Icon.jsx';
import { Painel, Etiqueta, Pulso } from './hud/index.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// LAYOUT — o chassi da aplicação na linguagem HUD.
//
// Barra lateral com marcador angular no item ativo, topo com a leitura de
// estado do fundador (seiva, nível, sequência) e o painel da Maiá no rodapé.
// Nenhum emoji na navegação: só glifos da biblioteca.
// ═══════════════════════════════════════════════════════════════════════════

const MENU = [
  { to: '/', icone: 'home', label: 'Home' },
  { to: '/strategy', icone: 'cpu', label: 'Strategy Core', selo: 'IA' },
  { to: '/dashboard', icone: 'grid', label: 'Dashboard' },
  { to: '/agentes', icone: 'bot', label: 'Agentes' },
  { to: '/mundo', icone: 'cubo', label: 'Vale ZoomDev', selo: '3D' },
  { to: '/projetos', icone: 'pasta', label: 'Projetos' },
  { to: '/bioeconomia', icone: 'folha', label: 'Bioeconomia' },
  { to: '/impacto', icone: 'globo', label: 'Impacto 360°', selo: 'ODS' },
  { to: '/compensacao', icone: 'mapa', label: 'Compensação' },
  { to: '/carbonpay', icone: 'moeda', label: 'CarbonPay', selo: 'FIN' },
  { to: '/configuracoes', icone: 'engrenagem', label: 'Configurações' },
];

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

export default function Layout({ children }) {
  const { user, setUser } = useUser();
  const nav = useNavigate();
  const [notifAbertas, setNotifAbertas] = useState(false);
  const [notificacoes, setNotificacoes] = useState([]);
  const [menuMovel, setMenuMovel] = useState(false);
  const notifRef = useRef(null);

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
  useEffect(() => {
    const fechar = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifAbertas(false); };
    document.addEventListener('mousedown', fechar);
    return () => document.removeEventListener('mousedown', fechar);
  }, []);

  const sair = () => { setToken(null); setUser(null); nav('/'); };

  const navegacao = (
    <nav className="flex-1 mt-1 overflow-y-auto">
      {itens.map(m => (
        <NavLink key={m.to} to={m.to} end={m.to === '/'}
          onClick={() => setMenuMovel(false)}
          className={({ isActive }) => `zd-menu-item flex items-center gap-3 px-5 py-2.5 text-[13px] font-medium ${isActive ? 'active' : ''}`}>
          {({ isActive }) => (
            <>
              <Icon nome={m.icone} tam={17} className={isActive ? '' : 'opacity-60'} />
              <span className="flex-1">{m.label}</span>
              {m.selo && (
                <Etiqueta cor={isActive ? '#00ff64' : '#00e5ff'} className="!text-[8px] !py-0.5 !px-1.5">
                  {m.selo}
                </Etiqueta>
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );

  const rodapeMaia = (
    <div className="p-4 border-t border-white/5">
      <Painel tamanho="p" className="p-3 flex items-center gap-3">
        <img src="/assets/agents/faces/maia.png" alt="Maiá"
          className="w-10 h-10 object-cover object-center shrink-0 hud-corte"
          style={{ '--c': '7px', boxShadow: '0 0 14px #00ff6440' }} />
        <div className="min-w-0">
          <div className="text-xs font-bold truncate">Maiá</div>
          <div className="hud-tec text-[8.5px] text-white/35">INTELIGÊNCIA REGENERATIVA</div>
          <div className="text-[10px] zd-green flex items-center gap-1.5 mt-1">
            <Pulso cor="#00ff64" /> em campo
          </div>
        </div>
      </Painel>
      <div className="hud-tec text-[9px] text-white/20 mt-3">© 2026 ZOOMDEV OS</div>
    </div>
  );

  return (
    <div className="min-h-screen zd-bg zd-circuit-bg hud-grade hud-scan flex">
      <aside className="zd-sidebar w-60 shrink-0 hidden md:flex flex-col relative z-10">
        <div className="px-4 py-6">
          <BrandLockup symbolSize={38} wordmarkHeight={30} />
        </div>
        {navegacao}
        {rodapeMaia}
      </aside>

      {/* Gaveta de navegação no celular */}
      {menuMovel && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setMenuMovel(false)}>
          <div className="absolute inset-0 bg-black/70" />
          <aside className="zd-sidebar w-64 h-full flex flex-col relative" onClick={e => e.stopPropagation()}>
            <div className="px-4 py-5 flex items-center justify-between">
              <BrandLockup symbolSize={32} wordmarkHeight={26} />
              <button onClick={() => setMenuMovel(false)} className="text-white/40 hover:text-white p-1">
                <Icon nome="fechar" tam={18} />
              </button>
            </div>
            {navegacao}
            {rodapeMaia}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <header className="border-b border-[#00e5ff1f]">
          <div className="flex items-center justify-between gap-4 px-4 md:px-5 py-3">
            <div className="flex items-center gap-3 md:hidden">
              <button onClick={() => setMenuMovel(true)} className="text-white/60 hover:text-white p-1" title="Menu">
                <Icon nome="lista" tam={20} />
              </button>
              <BrandLockup symbolSize={26} wordmarkHeight={20} />
            </div>

            <nav className="hidden lg:flex items-center gap-1">
              {TABS.map(t => (
                <NavLink key={t.to} to={t.to} end={t.to === '/'}
                  className={({ isActive }) => `px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[.04em] whitespace-nowrap transition-colors ${
                    isActive ? 'text-[#00ff64] bg-[#00ff6414]' : 'text-white/40 hover:text-white/85 hover:bg-white/5'}`}
                  style={({ isActive }) => (isActive ? { clipPath: CORTE_ABA } : undefined)}>
                  {t.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Etiqueta cor="#00ff64" title="Seiva: seus créditos de IA">
                <Icon nome="seiva" tam={11} /> {user.creditos}
              </Etiqueta>
              <Etiqueta cor="#00e5ff" title={`XP total: ${user.gamification.xp}`} className="hidden sm:inline-flex">
                NV {user.nivel.nivel} · {user.nivel.nome}
              </Etiqueta>
              {user.gamification.streak?.dias > 1 && (
                <Etiqueta cor="#ffc531" title="Sequência de dias construindo" className="hidden md:inline-flex">
                  <Icon nome="chama" tam={11} /> {user.gamification.streak.dias}d
                </Etiqueta>
              )}

              <div className="relative" ref={notifRef}>
                <button onClick={() => setNotifAbertas(v => !v)}
                  className="relative text-white/45 hover:text-[#00e5ff] transition-colors p-1" title="Notificações">
                  <Icon nome="transmissao" tam={18} />
                  {notificacoes.length > 0 && (
                    <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-[#00ff64]"
                      style={{ transform: 'rotate(45deg)' }} />
                  )}
                </button>
                {notifAbertas && (
                  <Painel aceso className="absolute right-0 mt-3 w-80 p-2 z-40">
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

              <button onClick={sair} title="Sair"
                className="text-white/35 hover:text-[#ff4d8d] transition-colors p-1">
                <Icon nome="cadeadoAberto" tam={17} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">{children}</main>
      </div>

      <Copiloto />
    </div>
  );
}
