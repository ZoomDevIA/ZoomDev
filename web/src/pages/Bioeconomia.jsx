import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import AgentAvatar from '../components/AgentAvatar.jsx';

// Explorer bio — clone do PlatformExplorer + BioStartups do protótipo
const BIO_MODULOS = [
  { id: 'bioeconomia', nome: 'Bioeconomia', emoji: '🌿', desc: 'Cadeias produtivas da sociobiodiversidade' },
  { id: 'comunidades', nome: 'Comunidades', emoji: '🏘️', desc: 'Povos tradicionais e etnociências' },
  { id: 'carbono', nome: 'Carbono', emoji: '🍃', desc: 'Créditos, MRV e compensação' },
  { id: 'rastreabilidade', nome: 'Rastreabilidade', emoji: '📍', desc: 'Da colheita à entrega, com prova' },
  { id: 'esg', nome: 'ESG', emoji: '📊', desc: 'Relatórios e compliance ambiental' },
  { id: 'biodiversidade', nome: 'Biodiversidade', emoji: '🦜', desc: 'Mapeamento e monitoramento' },
  { id: 'projetos_amazonicos', nome: 'Projetos Amazônicos', emoji: '🌳', desc: 'Casos e parcerias regionais' },
  { id: 'editais_especificos', nome: 'Editais Específicos', emoji: '📋', desc: 'MCTI, FINEP, COP30, BID, Banco Mundial' },
];

export default function Bioeconomia() {
  const [agentes, setAgentes] = useState(null);
  const [editais, setEditais] = useState([]);

  useEffect(() => {
    api.agents().then(setAgentes).catch(() => {});
    api.editais().then(e => setEditais(e.filter(x => x.tags.includes('bioeconomia') || x.tags.includes('sociobiodiversidade')))).catch(() => {});
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-7">
      <div>
        <h1 className="font-heading text-2xl font-bold">Escolha sua <span className="zd-gradient-text">Jornada</span></h1>
        <p className="text-white/55 text-sm mt-1.5">Duas especializações para acelerar sua startup: geral ou focada em bioeconomia sustentável.</p>
      </div>

      {/* Duas jornadas — clone do PlatformExplorer */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="zd-card-glow rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-[#00ff6420] flex items-center justify-center text-xl">⚡</div>
            <span className="zd-tag rounded-full px-2.5 py-1">Plataforma Principal</span>
          </div>
          <h2 className="font-heading font-bold text-lg mt-4">Zoom AI Startups</h2>
          <div className="text-xs zd-blue">Plataforma completa de desenvolvimento</div>
          <p className="text-sm text-white/55 mt-3 flex-1">
            Crie, valide e escale startups de qualquer setor com os agentes especializados. Do conceito ao deploy em minutos.
          </p>
          <ul className="text-xs text-white/60 space-y-1.5 mt-4">
            <li>▸ 5 agentes integrados no plano de negócios</li>
            <li>▸ Análise de mercado automatizada</li>
            <li>▸ Editais e oportunidades</li>
            <li>▸ Jornada gamificada Semente→Floresta</li>
          </ul>
          <Link to="/ideacao" className="zd-gradient-btn rounded-xl py-3 text-sm text-center mt-5">Explorar Plataforma →</Link>
        </div>

        <div className="zd-card-glow rounded-2xl p-6 flex flex-col border-[#00ff6440]">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-[#00ff6420] flex items-center justify-center text-xl">🌿</div>
            <span className="zd-tag rounded-full px-2.5 py-1">Especialização Bio</span>
          </div>
          <h2 className="font-heading font-bold text-lg mt-4">Zoom AI Bio Startups</h2>
          <div className="text-xs zd-blue">Especialização em Bioeconomia</div>
          <p className="text-sm text-white/55 mt-3 flex-1">
            Acelere iniciativas de bioeconomia amazônica com agentes especializados, rastreabilidade, créditos de carbono e editais focados.
          </p>
          <ul className="text-xs text-white/60 space-y-1.5 mt-4">
            <li>▸ 5 agentes amazônicos especializados</li>
            <li>▸ Rastreabilidade e créditos de carbono</li>
            <li>▸ Editais FINEP, BNDES, MCTI</li>
            <li>▸ Metodologias bio-inspiradas</li>
          </ul>
          <Link to="/ideacao" className="zd-gradient-btn rounded-xl py-3 text-sm text-center mt-5">Acessar Bio Startups →</Link>
        </div>
      </div>

      {/* Destaque de edital bio — copy do protótipo */}
      <div className="zd-notification rounded-xl px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm">
          🌎 <b>CONFAP · Amazônia+10</b> — Chamada nexBio Amazônia 2026: <b className="zd-green">R$ 107 milhões</b> para bionegócios
        </div>
        <Link to="/editais" className="zd-tag rounded-full px-3 py-1.5 hover:bg-[#00ff6430] transition-colors">Ver chamadas →</Link>
      </div>

      {/* Agentes amazônicos */}
      {agentes && (
        <section>
          <h2 className="font-heading text-lg font-bold mb-3">🌿 Agentes Amazônicos</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {agentes.bio.map(a => (
              <div key={a.id} className="zd-agent-card rounded-2xl p-4 text-center border-[#00ff6433]">
                <AgentAvatar agente={a} size="w-24 h-24" />
                <div className="font-heading font-bold text-sm mt-2.5">{a.nome}</div>
                <div className="text-[11px] text-white/50 mt-1">{a.papel}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Módulos bio */}
      <section>
        <h2 className="font-heading text-lg font-bold mb-3">Módulos Bio</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {BIO_MODULOS.map(m => (
            <div key={m.id} className="zd-agent-card rounded-xl p-4">
              <div className="text-xl">{m.emoji}</div>
              <div className="text-sm font-bold mt-1.5">{m.nome}</div>
              <div className="text-[11px] text-white/45 mt-0.5">{m.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Editais bio */}
      {editais.length > 0 && (
        <section>
          <h2 className="font-heading text-lg font-bold mb-3">Editais em destaque</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {editais.map(e => (
              <Link to="/editais" key={e.id} className="zd-card rounded-xl p-4 block hover:border-[#00ff6444] transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-bold">{e.nome}</div>
                  <div className="zd-tag rounded-full px-2 py-0.5">{e.valor}</div>
                </div>
                <div className="text-xs text-white/50 mt-1">{e.orgao} · foco: {e.foco}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
