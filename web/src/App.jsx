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
import Admin from './pages/Admin.jsx';
import Impacto from './pages/Impacto.jsx';
import Compensacao from './pages/Compensacao.jsx';
import Mundo from './pages/Mundo.jsx';
import Home from './pages/Home.jsx';
import Estilo from './pages/Estilo.jsx';
import Painel from './pages/Painel.jsx';
import Redefinir from './pages/Redefinir.jsx';
import Legal from './pages/Legal.jsx';


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
      if (g.xpGanho) notify({ tipo: 'xp', titulo: `+${g.xpGanho} XP`, detalhe: g.subiuNivel ? `Subiu para o nível ${g.nivel.nivel}: ${g.nivel.nome}! 🎉` : null });
      for (const c of g.novasConquistas || []) {
        notify({ tipo: 'conquista', titulo: `${c.emoji} Conquista: ${c.nome}`, detalhe: c.descricao });
      }
    }
  }, [notify]);

  // Área de administração: quem não tem porta lá nem vê a rota existir. O
  // fundador que digita /painel na barra cai na home, como em /admin.
  const podeAbrirPainel = Boolean(user) && (
    (user.capacidades || []).includes('usuarios.ler')
    || (user.capacidades || []).includes('comunidade.curar')
  );

  if (carregando) {
    return <div className="min-h-screen zd-bg flex items-center justify-center">
      <div className="zd-gradient-text font-heading text-2xl font-bold zd-pulse px-6 py-3">ZoomDev OS</div>
    </div>;
  }

  return (
    <UserContext.Provider value={{ user, setUser, refreshUser, celebrar }}>
      <ToastContext.Provider value={{ toasts, notify }}>
        {!user ? (
          /* Visitante: a home é pública, escreve a ideia primeiro, cria conta depois. */
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/entrar" element={<Login />} />
            <Route path="/redefinir" element={<Redefinir />} />
            <Route path="/termos" element={<Legal />} />
            <Route path="/privacidade" element={<Legal />} />
            <Route path="*" element={<Navigate to="/entrar" replace />} />
          </Routes>
        ) : (
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/entrar" element={<Navigate to="/" replace />} />
              {podeAbrirPainel && <Route path="/painel" element={<Painel />} />}
              <Route path="/strategy" element={<StrategyCore />} />
              <Route path="/ideacao" element={<Ideacao />} />
              <Route path="/agentes" element={<Agentes />} />
              <Route path="/projetos" element={<Projetos />} />
              <Route path="/projetos/:id" element={<Projeto />} />
              <Route path="/bioeconomia" element={<Bioeconomia />} />
              <Route path="/impacto" element={<Impacto />} />
              <Route path="/editais" element={<Editais />} />
              <Route path="/investidores" element={<Investidores />} />
              <Route path="/carbonpay" element={<CarbonPay />} />
              <Route path="/compensacao" element={<Compensacao />} />
              <Route path="/mundo" element={<Mundo />} />
              <Route path="/carbono" element={<Navigate to="/carbonpay" replace />} />
              <Route path="/planos" element={<Planos />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="/estilo" element={<Estilo />} />
              <Route path="/termos" element={<Legal />} />
              <Route path="/privacidade" element={<Legal />} />
              <Route path="/redefinir" element={<Navigate to="/configuracoes" replace />} />
              {user.isAdmin && <Route path="/admin" element={<Admin />} />}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Layout>
        )}
        <GamificationToasts />
      </ToastContext.Provider>
    </UserContext.Provider>
  );
}
