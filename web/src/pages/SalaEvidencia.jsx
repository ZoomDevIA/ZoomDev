import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import Icon from '../components/Icon.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// SALA DE EVIDÊNCIA — onde a prova é produzida.
//
// Por lote: o selo composto com a decomposição por frente (o elo fraco na
// cara), a trilha completa lacrada, o registro de evidência nova (com o
// sha256 do anexo calculado no navegador: o arquivo não sobe, o lacre sim)
// e a verificação da cadeia. Daqui sai o link do passaporte público.
// ═══════════════════════════════════════════════════════════════════════════

const COR_SELO = {
  VERIFICADO: '#00ff64', LAUDO: '#00e05a', CAMPO: '#a8e05a', PESQUISA: '#00c8ff',
  ESTRATEGIA: '#ffd700', HIPOTESE: '#ff9f43', VISAO: '#ffffff55',
};
const SELOS_REGISTRAVEIS = [
  ['VERIFICADO', 'Verificado 100 · documento oficial'],
  ['LAUDO', 'Laudo técnico 90 · assinado por responsável'],
  ['CAMPO', 'Campo 80 · foto, vídeo, leitura de sensor'],
  ['PESQUISA', 'Pesquisa 75 · literatura, dado oficial'],
  ['ESTRATEGIA', 'Estratégia 60 · plano, projeção'],
  ['HIPOTESE', 'Hipótese 50 · em investigação'],
];

async function sha256DoArquivo(arquivo) {
  const bytes = await arquivo.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function SalaEvidencia() {
  const [territorio, setTerritorio] = useState(null);
  const [loteId, setLoteId] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const [verificacao, setVerificacao] = useState(null);
  const [form, setForm] = useState({ tipo: '', selo: 'CAMPO', descricao: '' });
  const [anexo, setAnexo] = useState(null);   // { nome, hash }
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api.territorio().then(t => {
      setTerritorio(t);
      const primeiro = t.lotes.features.find(f => f.properties.status !== 'potencial');
      if (primeiro) setLoteId(primeiro.properties.id);
    }).catch(e => setErro(e.message));
  }, []);

  useEffect(() => {
    if (!loteId) return;
    setDetalhe(null); setVerificacao(null);
    api.trilhaEvidencias(loteId).then(setDetalhe).catch(() => {});
  }, [loteId]);

  const lotes = useMemo(() => territorio
    ? territorio.lotes.features.filter(f => f.properties.status !== 'potencial').map(f => f.properties)
    : [], [territorio]);

  const eloFraco = detalhe?.decomposicao?.length
    ? detalhe.decomposicao[detalhe.decomposicao.length - 1] : null;

  const escolherArquivo = async (e) => {
    const arq = e.target.files?.[0];
    if (!arq) return setAnexo(null);
    setAnexo({ nome: arq.name, hash: await sha256DoArquivo(arq) });
  };

  const registrar = async (e) => {
    e.preventDefault();
    setErro(null); setEnviando(true);
    try {
      await api.registrarEvidencia({
        loteId, tipo: form.tipo || 'registro', selo: form.selo,
        descricao: form.descricao, anexoHash: anexo?.hash || null,
      });
      setForm({ tipo: '', selo: 'CAMPO', descricao: '' });
      setAnexo(null);
      setDetalhe(await api.trilhaEvidencias(loteId));
    } catch (err) { setErro(err.message); }
    finally { setEnviando(false); }
  };

  const verificar = async () => {
    try { setVerificacao(await api.verificarCadeia(loteId)); } catch { /* silencioso */ }
  };

  const baixarTrilha = () => {
    const blob = new Blob([JSON.stringify(detalhe, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `trilha-${loteId}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold">Sala de <span className="zd-gradient-text">Evidência</span></h1>
          <p className="text-white/55 text-sm mt-1.5">
            Onde a prova é produzida: cada registro lacrado na cadeia de custódia, o elo mais fraco sempre à vista.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {lotes.map(l => (
            <button key={l.id} onClick={() => setLoteId(l.id)}
              className={`rounded-lg px-3 py-1.5 text-xs border transition-colors ${l.id === loteId
                ? 'border-[#00ff6466] bg-[#00ff640d] text-white' : 'border-white/12 text-white/60 hover:border-white/30'}`}>
              {l.id} · <span className="font-mono">{l.confianca}</span>
            </button>
          ))}
        </div>
      </div>

      {erro && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{erro}</div>}

      {detalhe && (
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-4 items-start">
          <div className="space-y-4">
            <div className="zd-card-glow rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[9px] tracking-[.2em] font-mono uppercase text-white/40 mb-1">
                    Selo vivo · o elo mais fraco governa
                  </div>
                  <div className="font-heading text-4xl font-bold" style={{ color: COR_SELO[detalhe.selo.selo] }}>
                    {detalhe.selo.confianca}
                    <span className="text-sm text-white/40 font-mono ml-2">{detalhe.selo.selo}</span>
                  </div>
                </div>
                <Link to={`/p/${loteId}`} target="_blank"
                  className="rounded-lg border border-white/15 hover:border-[#00e5ff66] px-3 py-1.5 text-[11px] text-white/70 transition-colors shrink-0 flex items-center gap-1.5">
                  <Icon nome="externo" tam={12} /> Passaporte público
                </Link>
              </div>

              <div className="mt-4 space-y-1.5">
                {detalhe.decomposicao.map(f => (
                  <div key={f.tipo} className="flex items-center gap-3">
                    <span className="text-[11.5px] text-white/70 capitalize w-36 shrink-0">{f.tipo.replace(/-/g, ' ')}</span>
                    <div className="flex-1 h-1.5 rounded bg-white/8 overflow-hidden">
                      <div className="h-full rounded" style={{ width: `${f.confianca}%`, background: COR_SELO[f.selo] }} />
                    </div>
                    <span className="text-[10px] font-mono w-24 text-right shrink-0" style={{ color: COR_SELO[f.selo] }}>
                      {f.selo} {f.confianca}{eloFraco?.tipo === f.tipo ? ' ← fraco' : ''}
                    </span>
                  </div>
                ))}
              </div>
              {eloFraco && (
                <p className="text-[11px] text-white/45 mt-3">
                  Próximo degrau: subir <b className="text-white/75 capitalize">{eloFraco.tipo.replace(/-/g, ' ')}</b> de{' '}
                  {eloFraco.selo} para um nível superior. É o único jeito de o selo composto do lote subir.
                </p>
              )}
            </div>

            <form onSubmit={registrar} className="zd-card rounded-2xl p-5 space-y-3">
              <div className="text-[9px] tracking-[.2em] font-mono uppercase text-white/40">
                Registrar evidência · entra lacrada na cadeia
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <input className="zd-input rounded-lg px-3 py-2.5 text-sm" placeholder="Frente (ex.: laudo-foliar, fotos)"
                  value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} />
                <select className="zd-input rounded-lg px-3 py-2.5 text-sm" value={form.selo}
                  onChange={e => setForm(f => ({ ...f, selo: e.target.value }))}>
                  {SELOS_REGISTRAVEIS.map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
                </select>
              </div>
              <textarea required minLength={10} rows={2} className="zd-input rounded-lg px-3 py-2.5 text-sm w-full"
                placeholder="O que foi observado, medido ou anexado (mínimo 10 caracteres)"
                value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
              <div className="flex items-center gap-3 flex-wrap">
                <label className="rounded-lg border border-white/15 hover:border-white/35 px-3 py-2 text-[11px] text-white/60 cursor-pointer transition-colors flex items-center gap-1.5">
                  <Icon nome="upload" tam={12} /> {anexo ? anexo.nome : 'Lacrar arquivo (sha256 no navegador)'}
                  <input type="file" className="hidden" onChange={escolherArquivo} />
                </label>
                {anexo && <span className="text-[9px] font-mono text-white/35 truncate max-w-[240px]">{anexo.hash}</span>}
                <button type="submit" disabled={enviando} className="zd-gradient-btn rounded-lg px-4 py-2 text-sm ml-auto">
                  {enviando ? 'Lacrando…' : 'Registrar →'}
                </button>
              </div>
            </form>
          </div>

          <div className="zd-card rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="text-[9px] tracking-[.2em] font-mono uppercase text-white/40">
                Trilha · {detalhe.trilha.length} registros
              </div>
              <div className="flex gap-2">
                <button onClick={baixarTrilha} title="Baixar a trilha em JSON"
                  className="rounded-lg border border-white/15 hover:border-white/35 px-2.5 py-1 text-[10px] text-white/60 transition-colors">
                  <Icon nome="download" tam={11} />
                </button>
                <button onClick={verificar}
                  className="rounded-lg border border-white/15 hover:border-[#00ff6466] px-2.5 py-1 text-[10px] text-white/60 transition-colors">
                  ⛓ verificar cadeia
                </button>
              </div>
            </div>

            {verificacao && (
              <div className={`rounded-lg px-3 py-2 mb-3 text-[11.5px] border ${verificacao.integra
                ? 'border-[#00ff6440] bg-[#00ff640a] text-white/70' : 'border-[#ff4d8d55] bg-[#ff4d8d0d] text-white/70'}`}>
                {verificacao.integra
                  ? <><b className="text-[#00ff64]">Íntegra.</b> {verificacao.registros} elos, nada alterado após o lacre.</>
                  : <><b className="text-[#ff4d8d]">Quebrada:</b> {verificacao.quebras.map(q => `posição ${q.posicao} (${q.motivo})`).join(' · ')}</>}
              </div>
            )}

            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {detalhe.trilha.map((ev, i) => (
                <div key={ev.id} className="rounded-lg border border-white/8 bg-white/[.02] px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono" style={{ color: COR_SELO[ev.selo] }}>
                      {ev.selo}{i === 0 ? ' · mais recente' : ''}
                    </span>
                    <span className="text-[9px] text-white/30 font-mono">{ev.em.slice(0, 16).replace('T', ' ')}</span>
                  </div>
                  <div className="text-[12px] text-white/70 mt-1 leading-snug">{ev.descricao}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    {ev.anexoHash && <span className="text-[8.5px] font-mono text-[#00e5ff88]">📎 anexo lacrado</span>}
                    <span className="text-[8.5px] font-mono text-white/22 truncate">{ev.hash}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
