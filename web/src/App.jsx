import React, { createContext, lazy, Suspense, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { api, getToken, setToken } from './lib/api.js';
import { aplicar as aplicarTema, gravarLocal as gravarTema } from './lib/tema.js';
import Layout from './components/Layout.jsx';
import Logo from './components/Logo.jsx';
import Ignicao from './components/Ignicao.jsx';
import Sensorial, { anunciarGanho } from './components/Sensorial.jsx';
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
import Territorio from './pages/Territorio.jsx';
import SalaEvidencia from './pages/SalaEvidencia.jsx';
import Malha from './pages/Malha.jsx';
import Passaporte from './pages/Passaporte.jsx';
import Compensacao from './pages/Compensacao.jsx';

import Home from './pages/Home.jsx';
import Estilo from './pages/Estilo.jsx';
import Painel from './pages/Painel.jsx';
import Redefinir from './pages/Redefinir.jsx';
import Legal from './pages/Legal.jsx';

// Carregados sob demanda: o Studio traz o editor de texto e o de código, e o
// Mundo traz a engine 3D. Juntos, eles dobravam o pacote inicial de quem só
// queria abrir o painel.
const Studio = lazy(() => import('./pages/Studio.jsx'));
const Mundo = lazy(() => import('./pages/Mundo.jsx'));

// Carga de uma seção pesada (Studio, Mundo). Mesma linguagem da ignição, em
// escala menor: quem já viu a partida reconhece o anel e sabe que é espera,
// não erro.
function Carregando() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="zd-ignicao-anel" style={{ width: 62, height: 62 }}>
        <Logo className="w-8 h-8" />
      </div>
      <div className="hud-tec text-[10px] text-white/35 uppercase tracking-[.2em]">carregando</div>
    </div>
  );
}


export const UserContext = createContext(null);
export const useUser = () => useContext(UserContext);

export default function App() {
  const [user, setUser] = useState(null);
  const [carregando, setCarregando] = useState(Boolean(getToken()));
  const [toasts, setToasts] = useState([]);

  // A partida roda uma vez por sessão de aba: ao abrir com credencial guardada
  // e ao entrar. A aplicação monta atrás dela, então quando a cortina sai já
  // está tudo pronto.
  const [ignicao, setIgnicao] = useState(Boolean(getToken()));
  const jaIgniu = useRef(false);

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

  // O tema guardado na conta vence o do navegador: entrar num computador novo
  // deve trazer a plataforma do jeito que a pessoa deixou, não do jeito de
  // fábrica. Só grava de volta se veio algo, para não apagar a escolha local
  // de quem nunca salvou na conta.
  useEffect(() => {
    if (!user?.tema) return;
    gravarTema(user.tema);
    aplicarTema(user.tema);
  }, [user?.tema]);

  // Entrou agora: dá a partida. `jaIgniu` impede que a cortina volte quando o
  // perfil é recarregado no meio da sessão, por exemplo ao salvar o tema.
  useEffect(() => {
    if (user && !jaIgniu.current) { jaIgniu.current = true; setIgnicao(true); }
    if (!user) jaIgniu.current = false;
  }, [user]);

  // A sessão vence por inatividade. Quando o servidor recusa o token, o
  // cliente da API já o descarta e avisa aqui: sem isso, a pessoa ficaria
  // numa tela logada que falha em toda ação, sem entender por quê.
  useEffect(() => {
    const aoExpirar = (e) => {
      setUser(null);
      setCarregando(false);
      setToasts(t => [...t, {
        id: 'sessao',
        titulo: 'Sessão encerrada',
        detalhe: e.detail?.motivo === 'inatividade'
          ? 'Você ficou muito tempo sem usar a plataforma. Entre de novo para continuar.'
          : 'Sua credencial não vale mais. Entre de novo para continuar.',
      }]);
    };
    window.addEventListener('zd:sessao-expirada', aoExpirar);
    return () => window.removeEventListener('zd:sessao-expirada', aoExpirar);
  }, []);

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
      if (g.xpGanho) {
        notify({ tipo: 'xp', titulo: `+${g.xpGanho} XP`, detalhe: g.subiuNivel ? `Subiu para o nível ${g.nivel.nivel}: ${g.nivel.nome}! 🎉` : null });
        anunciarGanho({ xp: g.xpGanho, tipo: g.subiuNivel ? 'nivel' : 'xp' });
      }
      for (const c of g.novasConquistas || []) {
        notify({ tipo: 'conquista', titulo: `${c.emoji} Conquista: ${c.nome}`, detalhe: c.descricao });
        anunciarGanho({ tipo: 'conquista' });
      }
    }
  }, [notify]);

  // Área de administração: quem não tem porta lá nem vê a rota existir. O
  // fundador que digita /painel na barra cai na home, como em /admin.
  const podeAbrirPainel = Boolean(user) && (
    (user.capacidades || []).includes('usuarios.ler')
    || (user.capacidades || []).includes('comunidade.curar')
  );

  return (
    <UserContext.Provider value={{ user, setUser, refreshUser, celebrar }}>
      <ToastContext.Provider value={{ toasts, notify }}>
        {/* A cortina fica no mesmo lugar da árvore o tempo todo, para que a
            chegada do perfil não reinicie a sequência do zero. Ela sai quando
            a partida termina E o perfil já chegou. */}
        {(ignicao || carregando) && (
          <Ignicao nome={user?.nome?.split(' ')[0]} onFim={() => setIgnicao(false)} />
        )}
        {carregando ? null : !user ? (
          /* Visitante: a home é pública, escreve a ideia primeiro, cria conta depois. */
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/entrar" element={<Login />} />
            <Route path="/redefinir" element={<Redefinir />} />
            <Route path="/termos" element={<Legal />} />
            <Route path="/privacidade" element={<Legal />} />
            {/* O passaporte do hectare é público por natureza: é o QR que o
                comprador escaneia, e comprador não tem conta. */}
            <Route path="/p/:loteId" element={<Passaporte />} />
            <Route path="*" element={<Navigate to="/entrar" replace />} />
          </Routes>
        ) : (
          <Layout>
            <Suspense fallback={<Carregando />}>
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
              <Route path="/studio/:id" element={<Studio />} />
              <Route path="/bioeconomia" element={<Bioeconomia />} />
              <Route path="/territorio" element={<Territorio />} />
              <Route path="/evidencias" element={<SalaEvidencia />} />
              <Route path="/malha" element={<Malha />} />
              <Route path="/p/:loteId" element={<Passaporte />} />
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
            </Suspense>
          </Layout>
        )}
        <Sensorial />
        <GamificationToasts />
      </ToastContext.Provider>
    </UserContext.Provider>
  );
}
