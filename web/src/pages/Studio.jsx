import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { api, gerarDocumentoSSE } from '../lib/api.js';
import { EVENTO_CHASSI, useFoco } from '../lib/foco.js';
import { useUser } from '../App.jsx';
import Chassi from '../components/studio/Chassi.jsx';
import BarraFase, { faseDe } from '../components/studio/BarraFase.jsx';
import Console from '../components/studio/Console.jsx';
import Palco from '../components/studio/Palco.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// ZOOMDEV STUDIO — o espaço de trabalho do fundador.
//
// Duas janelas e uma trilha. À esquerda se conversa, à direita se constrói.
// A fase decide o que a direita mostra: na ideação, o plano de negócios num
// editor de verdade; na validação, as missões; no MVP, o código rodando.
//
// O documento salva sozinho um segundo depois da última tecla. Perder texto
// de plano de negócios porque a aba fechou é o tipo de falha que faz alguém
// nunca mais voltar.
// ═══════════════════════════════════════════════════════════════════════════

const ESPERA_SALVAR = 1100;

export default function Studio() {
  const { id } = useParams();
  const nav = useNavigate();
  const ctx = useUser();

  const raiz = useRef(null);
  const [altura, setAltura] = useState(null);

  const [projeto, setProjeto] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [faseVista, setFaseVista] = useState(null);

  const [mensagens, setMensagens] = useState([]);
  const [trabalhando, setTrabalhando] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState(null);
  const [aviso, setAviso] = useState(null);

  const [documento, setDocumento] = useState('');
  const [salvandoEm, setSalvandoEm] = useState(null);
  const [gerando, setGerando] = useState(false);
  const [progresso, setProgresso] = useState(null);
  const temporizador = useRef(null);
  const documentoServidor = useRef('');

  // O Studio é a oficina: pede o chassi recolhido enquanto estiver aberto.
  useFoco(true);

  // ── A altura do palco é medida, não chutada ──────────────────────────────
  // Além do redimensionamento da janela, o chassi avisa quando ele mesmo
  // encolhe: entrar no modo foco muda a altura disponível sem que a janela
  // mude de tamanho, e sem esse aviso o palco ficaria curto.
  useEffect(() => {
    const medir = () => {
      const topo = raiz.current?.getBoundingClientRect().top ?? 0;
      setAltura(Math.max(440, window.innerHeight - topo - 16));
    };
    medir();
    window.addEventListener('resize', medir);
    window.addEventListener(EVENTO_CHASSI, medir);
    return () => {
      window.removeEventListener('resize', medir);
      window.removeEventListener(EVENTO_CHASSI, medir);
    };
  }, [carregando]);

  // ── Carga ────────────────────────────────────────────────────────────────
  const carregar = useCallback(async () => {
    try {
      const p = await api.projeto(id);
      setProjeto(p);
      setFaseVista(f => f || p.fase || 'ideacao');
      documentoServidor.current = p.documento || '';
      setDocumento(d => (d && d !== documentoServidor.current ? d : (p.documento || '')));
      if (p.trilha?.length) setMensagens(m => (m.length ? m : p.trilha));
      return p;
    } catch (e) {
      setErro(e.message);
      if (e.status === 404) setTimeout(() => nav('/projetos'), 1600);
      return null;
    } finally { setCarregando(false); }
  }, [id, nav]);

  useEffect(() => { setCarregando(true); carregar(); }, [carregar]);

  // ── Salvamento automático do documento ───────────────────────────────────
  const aoMudarDocumento = useCallback((html) => {
    setDocumento(html);
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(async () => {
      if (html === documentoServidor.current) return;
      try {
        await api.salvarDocumento(id, html);
        documentoServidor.current = html;
        setSalvandoEm(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      } catch (e) { setAviso(`Não consegui salvar o documento: ${e.message}`); }
    }, ESPERA_SALVAR);
  }, [id]);

  // Salva o que estiver pendente antes de a aba fechar
  useEffect(() => () => clearTimeout(temporizador.current), []);
  useEffect(() => {
    const aoSair = (e) => {
      if (documento && documento !== documentoServidor.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', aoSair);
    return () => window.removeEventListener('beforeunload', aoSair);
  }, [documento]);

  // ── Geração do plano ─────────────────────────────────────────────────────
  const gerar = useCallback(async () => {
    if (gerando) return;
    setGerando(true); setErro(null); setProgresso({ etapas: [] });
    setMensagens(m => [...m, { id: `sys${Date.now()}`, papel: 'marco', texto: 'Geração do plano iniciada' }]);
    try {
      await gerarDocumentoSSE(id, {
        inicio: (d) => setProgresso({ etapas: (d.etapas || []).map(e => ({ ...e, estado: 'espera' })) }),
        etapa: (d) => setProgresso(p => ({
          ...p,
          fonte: d.fonte || p?.fonte,
          etapas: (p?.etapas || []).map(e => (e.id === d.id ? { ...e, ...d } : e)),
        })),
        previa: (d) => setProgresso(p => ({ ...p, previa: d.texto })),
        fala: (d) => setMensagens(m => [...m, { id: `a${Date.now()}${m.length}`, papel: 'agente', ...d }]),
        documento: (d) => {
          setDocumento(d.html);
          documentoServidor.current = d.html;
          setSalvandoEm(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        },
        fim: async (d) => {
          await carregar();
          await ctx?.refreshUser?.();
          if (d?.gamificacao) ctx?.celebrar?.(d.gamificacao);
          setMensagens(m => [...m, { id: `sys${Date.now()}`, papel: 'marco', texto: 'Plano de negócios pronto' }]);
        },
        erro: (d) => setErro(d.error || 'A geração falhou.'),
      });
    } catch (e) {
      setErro(e.message);
    } finally { setGerando(false); setProgresso(null); }
  }, [id, gerando, carregar, ctx]);

  // ── Envio do console ─────────────────────────────────────────────────────
  const enviar = useCallback(async ({ texto, anexos, preLeitura }) => {
    setErro(null); setAviso(null);
    setMensagens(m => [...m, { id: `u${Date.now()}`, papel: 'usuario', texto, anexos }]);
    setOcupado(true);
    setTrabalhando({
      titulo: 'PROCESSANDO',
      passos: [{ id: 'ler', label: 'Lendo o pedido e o contexto do projeto', estado: 'executando' }],
    });
    try {
      const r = await api.conversaStudio(id, {
        texto, anexos, preLeitura,
        fase: faseVista,
        documento: faseVista === 'ideacao' ? documento : undefined,
      });

      if (r.documento != null) {
        setDocumento(r.documento);
        documentoServidor.current = r.documento;
        setSalvandoEm(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      }
      for (const f of r.falas || []) {
        setMensagens(m => [...m, { id: `a${Date.now()}${m.length}`, papel: 'agente', ...f }]);
      }
      if (r.recarregar) await carregar();
      if (r.gamificacao) { ctx?.celebrar?.(r.gamificacao); await ctx?.refreshUser?.(); }
    } catch (e) {
      setErro(e.message);
    } finally { setOcupado(false); setTrabalhando(null); }
  }, [id, faseVista, documento, carregar, ctx]);

  // ── Estados de carga ─────────────────────────────────────────────────────
  if (carregando) {
    return (
      <div className="flex items-center justify-center py-24">
        <Icon nome="atualizar" tam={26} className="text-[#00e5ff] animate-spin" />
      </div>
    );
  }

  if (!projeto) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <Icon nome="alerta" tam={30} className="text-[#ff4d8d] mx-auto" />
        <p className="text-white/60">{erro || 'Projeto não encontrado.'}</p>
        <Link to="/projetos" className="hud-botao px-4 py-2 inline-flex items-center gap-2 text-sm">
          <Icon nome="pasta" tam={14} /> Meus projetos
        </Link>
      </div>
    );
  }

  const info = faseDe(faseVista);

  return (
    <div ref={raiz} style={{ height: altura ? `${altura}px` : undefined }}>
      <Chassi
        rotuloPalco={info.palco}
        barraFase={
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <BarraFase projeto={projeto} vista={faseVista} onIr={setFaseVista} />
            </div>
            <Link to={`/projetos/${projeto.id}`} title="Ver a ficha completa do projeto"
              className="hud-botao-vazio px-2.5 py-1.5 text-[10px] hud-caps flex items-center gap-1.5 shrink-0 mt-0.5">
              <Icon nome="lista" tam={12} /> <span className="hidden sm:inline">Ficha</span>
            </Link>
          </div>
        }
        console={
          <Console
            projeto={projeto}
            mensagens={mensagens}
            trabalhando={trabalhando}
            onEnviar={enviar}
            ocupado={ocupado || gerando}
            erro={erro}
            aviso={aviso}
          />
        }
        palco={
          <Palco
            fase={faseVista}
            projeto={projeto}
            documento={documento}
            onDocumento={aoMudarDocumento}
            salvandoEm={salvandoEm}
            gerando={gerando}
            progresso={progresso}
            onGerar={gerar}
            onAtualizar={carregar}
            onAviso={setAviso}
            onMarco={(t) => setMensagens(m => [...m, { id: `sys${Date.now()}`, papel: 'marco', texto: t }])}
          />
        }
      />
    </div>
  );
}
