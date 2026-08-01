import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useUser } from '../App.jsx';

const TIPOS = [
  { id: 'auto', label: '✨ Deixar a IA decidir', desc: 'O sistema identifica e classifica automaticamente' },
  { id: 'startup', label: '🚀 Startup', desc: 'Negócio digital de qualquer setor' },
  { id: 'biostartup', label: '🌿 BioStartup', desc: 'Bioeconomia, floresta, carbono e impacto' },
];

export default function Ideacao() {
  const nav = useNavigate();
  const { celebrar, refreshUser } = useUser();
  const [descricao, setDescricao] = useState('');
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('auto');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  const enviar = async (e) => {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const r = await api.ideacao({ descricao, tipo, nome });
      celebrar(r.gamificacao);
      await refreshUser();
      nav(`/projetos/${r.projeto.id}`, { state: { recemCriado: true } });
    } catch (err) {
      setErro(err.message);
      setEnviando(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Você tem uma ideia? <span className="zd-gradient-text">Vamos desenvolvê-la AGORA.</span></h1>
        <p className="text-white/55 text-sm mt-1.5">Esse é o seu espaço de co-criação — comece pelo começo: descreva a ideia com suas palavras.</p>
      </div>

      <form onSubmit={enviar} className="zd-card-glow rounded-2xl p-6 space-y-5">
        <div>
          <label className="text-xs text-white/60 block mb-1.5">Sua ideia *</label>
          <textarea
            required minLength={20} rows={5}
            className="zd-input w-full rounded-xl px-4 py-3 text-sm resize-y"
            placeholder="Ex.: Quero criar uma plataforma que conecta cooperativas de açaí do Pará a compradores internacionais, com rastreabilidade da colheita à entrega e certificação de origem…"
            value={descricao} onChange={e => setDescricao(e.target.value)}
          />
          <div className="text-[11px] text-white/35 mt-1">{descricao.length} caracteres · mínimo 20</div>
        </div>

        <div>
          <label className="text-xs text-white/60 block mb-1.5">Nome do projeto (opcional — a IA sugere um)</label>
          <input className="zd-input w-full rounded-lg px-4 py-2.5 text-sm" placeholder="Ex.: Açaí Trace" value={nome} onChange={e => setNome(e.target.value)} />
        </div>

        <div>
          <label className="text-xs text-white/60 block mb-2">Tipo de jornada</label>
          <div className="grid sm:grid-cols-3 gap-3">
            {TIPOS.map(t => (
              <button type="button" key={t.id} onClick={() => setTipo(t.id)}
                className={`text-left rounded-xl border p-3.5 transition-all ${tipo === t.id ? 'border-[#00ff64] bg-[#00ff6414] zd-glow-green' : 'border-white/10 bg-white/[.03] hover:border-white/25'}`}>
                <div className="text-sm font-semibold">{t.label}</div>
                <div className="text-[11px] text-white/45 mt-1">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {erro && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{erro}</div>}

        <div className="flex flex-col sm:flex-row gap-3">
          <button type="submit" disabled={enviando || descricao.trim().length < 20}
            className="zd-gradient-btn flex-1 rounded-xl py-3.5 text-sm">
            {enviando ? 'Estruturando sua ideia…' : '✦ Estruturar ideia e iniciar jornada →'}
          </button>
          <Link to="/carbono"
            className="rounded-xl border border-[#00c8ff44] text-[#00c8ff] hover:bg-[#00c8ff12] transition-colors px-5 py-3.5 text-sm text-center font-semibold"
            title="Calcule o passivo ambiental do seu negócio e compense com créditos de carbono">
            🍃 Calculadora de Passivo Ambiental
          </Link>
        </div>
        <p className="text-[11px] text-white/35">
          Ao estruturar, você ganha XP e desbloqueia a geração do plano de negócios pelos 5 agentes ZoomDev.
          Se não escolher o tipo, a IA classifica sua ideia como Startup ou BioStartup e mostra a jornada correspondente.
        </p>
      </form>
    </div>
  );
}
