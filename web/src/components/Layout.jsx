import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useUser } from '../App.jsx';
import { setToken } from '../lib/api.js';
import Logo from './Logo.jsx';

const MENU = [
  { to: '/', label: 'Dashboard', icon: '◈' },
  { to: '/ideacao', label: 'Nova Ideia', icon: '✦' },
  { to: '/carbono', label: 'Calculadora Carbono', icon: '🍃' },
  { to: '/planos', label: 'Planos', icon: '◆' },
];

export default function Layout({ children }) {
  const { user, setUser } = useUser();
  const nav = useNavigate();

  const sair = () => { setToken(null); setUser(null); nav('/'); };

  return (
    <div className="min-h-screen zd-bg zd-circuit-bg flex">
      <aside className="zd-sidebar w-60 shrink-0 hidden md:flex flex-col">
        <div className="px-5 py-6 flex items-center gap-2">
          <Logo className="w-9 h-9" />
          <div>
            <div className="font-heading font-bold text-lg leading-none">ZoomDev <span className="zd-green">OS</span></div>
            <div className="text-[10px] tracking-[.25em] text-white/40 mt-1">IDEA TO EXIT</div>
          </div>
        </div>
        <nav className="flex-1 mt-2">
          {MENU.map(m => (
            <NavLink key={m.to} to={m.to} end={m.to === '/'}
              className={({ isActive }) => `zd-menu-item ${isActive ? 'active' : ''} flex items-center gap-3 px-5 py-3 text-sm font-medium`}>
              <span className="text-base w-5 text-center">{m.icon}</span> {m.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 text-xs text-white/35 border-t border-white/5">
          © 2026 ZoomDev OS
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between gap-4 px-5 py-3 border-b border-white/5">
          <div className="md:hidden flex items-center gap-2">
            <Logo className="w-7 h-7" /><span className="font-heading font-bold">ZoomDev OS</span>
          </div>
          <div className="hidden md:block text-sm text-white/50">
            Bem-vindo(a) de volta, <span className="text-white/90 font-medium">{user.nome}</span> 👋
          </div>
          <div className="flex items-center gap-3">
            <div className="zd-tag px-2.5 py-1 rounded-full" title="Seiva: seus créditos de IA">🌿 {user.creditos}</div>
            <div className="zd-tag-blue px-2.5 py-1 rounded-full" title={`XP total: ${user.gamification.xp}`}>
              Nv {user.nivel.nivel} · {user.nivel.nome}
            </div>
            {user.gamification.streak?.dias > 1 && (
              <div className="zd-tag px-2.5 py-1 rounded-full" title="Streak de dias construindo">🔥 {user.gamification.streak.dias}d</div>
            )}
            <button onClick={sair} className="text-white/40 hover:text-white/80 text-sm transition-colors">Sair</button>
          </div>
        </header>
        <main className="flex-1 p-5 md:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
