import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { api, getToken, setToken } from './lib/api.js';
import Layout from './components/Layout.jsx';
import GamificationToasts, { ToastContext } from './components/GamificationToasts.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Ideacao from './pages/Ideacao.jsx';
import Projeto from './pages/Projeto.jsx';
import Projetos from './pages/Projetos.jsx';
import CarbonPay from './pages/CarbonPay.jsx';
import Planos from './pages/Planos.jsx';
import Agentes from './pages/Agentes.jsx';
import Bioeconomia from './pages/Bioeconomia.jsx';
import Editais from './pages/Editais.jsx';
import Investidores from './pages/Investidores.jsx';
import Configuracoes from './pages/Configuracoes.jsx';
import StrategyCore from './pages/StrategyCore.jsx';

export const UserContext = createContext(null);
export const useUser = () => useContext(UserContext);

export default function App() {
  const [user, setUser] = useState(null);
  const [carregando, setCarregando] = useState(Boolean(getToken()));
  const [toasts, setToasts] = useState([]);

  const refreshUser = useCallback(async () => {
    try {
      setUser(await api.me());
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (getToken()) refreshUser();
  }, [refreshUser]);

  const notify = useCallback((toast) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, ...toast }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 5200);
  }, []);

  // Celebra eventos de gamificação vindos da API
  const celebrar = useCallback((gam) => {
    const lista = Array.isArray(gam) ? gam : [gam];
    for (const g of lista) {
      if (!g) continue;
      if (g.xpGanho) notify({ tipo: 'xp', titulo: `+${g.xpGanho} XP`, detalhe: g.subiuNivel ? `Subiu para o nível ${g.nivel.nivel} — ${g.nivel.nome}! 🎉` : null });
      for (const c of g.novasConquistas || []) {
        notify({ tipo: 'conquista', titulo: `${c.emoji} Conquista: ${c.nome}`, detalhe: c.descricao });
      }
    }
  }, [notify]);

  if (carregando) {
    return <div className="min-h-screen zd-bg flex items-center justify-center">
      <div className="zd-gradient-text font-heading text-2xl font-bold zd-pulse px-6 py-3">ZoomDev OS</div>
    </div>;
  }

  return (
    <UserContext.Provider value={{ user, setUser, refreshUser, celebrar }}>
      <ToastContext.Provider value={{ toasts, notify }}>
        {!user ? (
          <Routes>
            <Route path="*" element={<Login />} />
          </Routes>
        ) : (
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/strategy" element={<StrategyCore />} />
              <Route path="/ideacao" element={<Ideacao />} />
              <Route path="/agentes" element={<Agentes />} />
              <Route path="/projetos" element={<Projetos />} />
              <Route path="/projetos/:id" element={<Projeto />} />
              <Route path="/bioeconomia" element={<Bioeconomia />} />
              <Route path="/editais" element={<Editais />} />
              <Route path="/investidores" element={<Investidores />} />
              <Route path="/carbonpay" element={<CarbonPay />} />
              <Route path="/carbono" element={<Navigate to="/carbonpay" replace />} />
              <Route path="/planos" element={<Planos />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Layout>
        )}
        <GamificationToasts />
      </ToastContext.Provider>
    </UserContext.Provider>
  );
}
