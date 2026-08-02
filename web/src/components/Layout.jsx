import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useUser } from '../App.jsx';
import { api, setToken } from '../lib/api.js';
import Logo from './Logo.jsx';
import BrandLockup from './BrandLockup.jsx';
import Copiloto from './Copiloto.jsx';

// Sidebar de 7 itens — clone do protótipo Base44
const MENU = [
  { to: '/strategy', label: 'Strategy Core', icon: '🧠', badge: 'IA' },
  { to: '/', label: 'Dashboard', icon: '◈' },
  { to: '/agentes', label: 'Agentes', icon: '🤖' },
  { to: '/projetos', label: 'Projetos', icon: '📁' },
  { to: '/bioeconomia', label: 'Bioeconomia', icon: '🌿' },
  { to: '/impacto', label: 'Impacto 360°', icon: '🌍', badge: 'ODS' },
  { to: '/compensacao', label: 'Compensação', icon: '🗺️', badge: 'Plano' },
  { to: '/carbonpay', label: 'CarbonPay', icon: '🍃', badge: 'Fintech' },
  { to: '/configuracoes', label: 'Configurações', icon: '⚙️' },
];

// Tabs da topbar do protótipo
const TABS = [
  { to: '/', label: 'Plataforma' },
  { to: '/agentes', label: 'Agentes' },
  { to: '/projetos', label: 'Projetos' },
  { to: '/bioeconomia', label: 'Bio Startups' },
  { to: '/impacto', label: 'Impacto 360°' },
  { to: '/editais', label: 'Editais' },
  { to: '/investidores', label: 'Investidores' },
  { to: '/carbonpay', label: 'CarbonPay' },
];

export default function Layout({ children }) {
  const { user, setUser } = useUser();
  const nav = useNavigate();
  const [notifAbertas, setNotifAbertas] = useState(false);
  const [notificacoes, setNotificacoes] = useState([]);
  const notifRef = useRef(null);

  useEffect(() => { api.notificacoes().then(setNotificacoes).catch(() => {}); }, []);
  useEffect(() => {
    const fechar = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifAbertas(false); };
    document.addEventListener('mousedown', fechar);
    return () => document.removeEventListener('mousedown', fechar);
  }, []);

  const sair = () => { setToken(null); setUser(null); nav('/'); };

  return (
    <div className="min-h-screen zd-bg zd-circuit-bg flex">
      <aside className="zd-sidebar w-60 shrink-0 hidden md:flex flex-col">
        <div className="px-4 py-6">
          <BrandLockup symbolSize={40} wordmarkHeight={32} />
        </div>
        <nav className="flex-1 mt-1">
          {[...MENU, ...(user.isAdmin ? [{ to: '/admin', label: 'Sexta-Feira', icon: '🕶️', badge: 'Admin' }] : [])].map(m => (
            <NavLink key={m.to} to={m.to} end={m.to === '/'}
              className={({ isActive }) => `zd-menu-item ${isActive ? 'active' : ''} flex items-center gap-3 px-5 py-3 text-sm font-medium`}>
              <span className="text-base w-5 text-center">{m.icon}</span>
              <span className="flex-1">{m.label}</span>
              {m.badge && <span className={m.badge === 'IA' ? 'zd-tag rounded px-1.5 py-0.5' : 'zd-tag-blue rounded px-1.5 py-0.5'}>{m.badge}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <div className="zd-card rounded-xl p-3.5 flex items-center gap-3">
            <img src="/assets/site/copiloto-avatar.png" alt="Zoom Intelligence"
              className="w-10 h-10 rounded-full object-cover object-top border border-[#00ff6433] shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-bold truncate">Zoom Intelligence</div>
              <div className="text-[10px] text-white/45">Sua IA de confiança</div>
              <div className="text-[10px] zd-green flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#00ff64] inline-block" /> Online</div>
            </div>
          </div>
          <div className="text-[10px] text-white/30 mt-3">© 2026 ZoomDev OS</div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-white/5">
          <div className="flex items-center justify-between gap-4 px-5 py-3">
            <div className="md:hidden">
              <BrandLockup symbolSize={28} wordmarkHeight={22} />
            </div>
            <nav className="hidden lg:flex items-center gap-1">
              {TABS.map(t => (
                <NavLink key={t.to} to={t.to} end={t.to === '/'}
                  className={({ isActive }) => `px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${isActive ? 'text-[#00ff64] bg-[#00ff6414]' : 'text-white/50 hover:text-white/85 hover:bg-white/5'}`}>
                  {t.label}
                </NavLink>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <div className="zd-tag px-2.5 py-1 rounded-full" title="Seiva: seus créditos de IA">🌿 {user.creditos}</div>
              <div className="zd-tag-blue px-2.5 py-1 rounded-full" title={`XP total: ${user.gamification.xp}`}>
                Nv {user.nivel.nivel} · {user.nivel.nome}
              </div>
              {user.gamification.streak?.dias > 1 && (
                <div className="zd-tag px-2.5 py-1 rounded-full" title="Streak de dias construindo">🔥 {user.gamification.streak.dias}d</div>
              )}
              <div className="relative" ref={notifRef}>
                <button onClick={() => setNotifAbertas(v => !v)} className="relative text-white/50 hover:text-white/90 transition-colors text-lg" title="Notificações">
                  🔔
                  {notificacoes.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#00ff64]" />}
                </button>
                {notifAbertas && (
                  <div className="absolute right-0 mt-2 w-80 zd-card-glow rounded-xl p-2 z-40">
                    <div className="text-xs font-bold text-white/60 px-2 py-1.5">Notificações</div>
                    {notificacoes.map(n => (
                      <div key={n.id} className="zd-notification rounded-lg px-3 py-2.5 mb-1.5">
                        <div className="text-xs font-semibold">{n.titulo}</div>
                        <div className="text-[11px] text-white/55 mt-0.5">{n.detalhe}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={sair} className="text-white/40 hover:text-white/80 text-sm transition-colors">Sair</button>
            </div>
          </div>
        </header>
        <main className="flex-1 p-5 md:p-8 overflow-x-hidden">{children}</main>
      </div>

      <Copiloto />
    </div>
  );
}
