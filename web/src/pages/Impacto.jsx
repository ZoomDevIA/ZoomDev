import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';

// ═══════════════════════════════════════════════════════════════════════════
// IMPACTO REGENERATIVO 360° — Biogenesis COT BioTechnology
// Simulador que traduz a aplicação prática da biotecnologia em impacto real:
// segurança alimentar, transição energética justa, carbono, economia e ODS.
// Cada número carrega o Selo de Evidência que o sustenta.
// ═══════════════════════════════════════════════════════════════════════════

const fmt = (v, d = 0) => Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: d });
const brl = (v) => `R$ ${fmt(v)}`;

function SeloBadge({ selo, selos, mini }) {
  const s = selos?.find(x => x.id === selo);
  if (!s) return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border ${mini ? 'px-1.5 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[11px]'} font-semibold`}
      style={{ borderColor: `${s.cor}55`, color: s.cor, background: `${s.cor}12` }} title={s.descricao}>
      {s.emoji} {s.nome} · {s.confianca}%
    </span>
  );
}

function Metrica({ emoji, valor, unidade, label, cor = '#00ff64' }) {
  return (
    <div className="zd-stat-card rounded-xl p-4">
      <div className="text-lg">{emoji}</div>
      <div className="font-heading text-2xl font-bold mt-1" style={{ color: cor }}>
        {valor}<span className="text-xs text-white/40 font-normal ml-1">{unidade}</span>
      </div>
      <div className="text-[11px] text-white/55 mt-1 leading-snug">{label}</div>
    </div>
  );
}

function Secao({ titulo, sub, children, direita }) {
  return (
    <section>
      <div className="flex items-end justify-between gap-3 mb-3 flex-wrap">
        <div>
          <h2 className="font-heading text-lg font-bold">{titulo}</h2>
          {sub && <p className="text-xs text-white/45 mt-0.5">{sub}</p>}
        </div>
        {direita}
      </div>
      {children}
    </section>
  );
}

// ── Simulador 360° ──────────────────────────────────────────────────────────
function Simulador({ dossie }) {
  const [culturaId, setCulturaId] = useState('mandioca');
  const [hectares, setHectares] = useState(735);
  const [cenarioId, setCenarioId] = useState('conservador');
  const [r, setR] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const simular = async () => {
    setCarregando(true);
    try { setR(await api.simularImpacto({ culturaId, hectares, cenarioId })); }
    catch (e) { setR({ erro: e.message }); }
    finally { setCarregando(false); }
  };

  useEffect(() => { simular(); /* eslint-disable-next-line */ }, []);

  const cenario = dossie?.cenarios?.find(c => c.id === cenarioId);
  const selos = dossie?.selos;

  return (
    <div className="space-y-5">
      <div className="zd-card-glow rounded-2xl p-5 space-y-4">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-white/60 block mb-1.5">Cultura</label>
            <select value={culturaId} onChange={e => setCulturaId(e.target.value)}
              className="zd-input w-full rounded-lg px-3 py-2.5 text-sm">
              {(dossie?.culturas || []).map(c => (
                <option key={c.id} value={c.id}>{c.emoji} {c.nome}{c.prioridadeAmapa ? ' ★' : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/60 block mb-1.5">Área (hectares)</label>
            <input type="number" min={1} value={hectares} onChange={e => setHectares(Number(e.target.value))}
              className="zd-input w-full rounded-lg px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-xs text-white/60 block mb-1.5">Cenário de ganho</label>
            <select value={cenarioId} onChange={e => setCenarioId(e.target.value)}
              className="zd-input w-full rounded-lg px-3 py-2.5 text-sm">
              {(dossie?.cenarios || []).map(c => (
                <option key={c.id} value={c.id}>{c.nome} (+{Math.round(c.upliftProdutividade * 100)}%)</option>
              ))}
            </select>
          </div>
        </div>

        {cenario && (
          <div className="rounded-lg bg-white/[.04] border border-white/8 p-3 flex items-start gap-3">
            <SeloBadge selo={cenario.selo} selos={selos} />
            <p className="text-[11px] text-white/55 leading-relaxed flex-1">{cenario.base}</p>
          </div>
        )}

        <button onClick={simular} disabled={carregando} className="zd-gradient-btn w-full rounded-xl py-3 text-sm">
          {carregando ? 'Calculando impacto…' : '🌍 Simular impacto 360°'}
        </button>
      </div>

      {r?.erro && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{r.erro}</div>}

      {r && !r.erro && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <Metrica emoji="🍽️" valor={fmt(r.resumo.pessoasAlimentadasAno)} unidade="pessoas/ano" label="Segurança alimentar (equivalente calórico)" />
            <Metrica emoji="⚡" valor={fmt(r.resumo.energiaKwhAno)} unidade="kWh/ano" label="Energia limpa de biogás comunitário" cor="#00c8ff" />
            <Metrica emoji="🌳" valor={fmt(r.resumo.co2eSequestradoTonAno, 1)} unidade="tCO₂e" label="Sequestro adicional (estimativa)" />
            <Metrica emoji="🚫" valor={fmt(r.resumo.co2eEvitadoTonAno, 1)} unidade="tCO₂e" label="Emissão evitada por substituir fóssil" cor="#00c8ff" />
            <Metrica emoji="💰" valor={brl(r.resumo.impactoEconomicoReais)} unidade="" label="Impacto econômico anual" cor="#ffd700" />
            <Metrica emoji="🇺🇳" valor={r.resumo.odsAtendidos} unidade="ODS" label="Objetivos de Desenvolvimento Sustentável" cor="#a855f7" />
          </div>

          {/* Transição energética justa — o elo entre agricultura e energia */}
          <div className="zd-card-glow rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
              <h3 className="font-heading font-bold">⚡ Transição Energética Verde Justa</h3>
              <SeloBadge selo={r.dimensoes.energetico.selo} selos={selos} />
            </div>
            <p className="text-xs text-white/50 mb-4">
              O ganho de biomassa vira resíduo, o resíduo vira biogás, o biogás vira energia da própria comunidade.
            </p>

            <div className="flex items-center gap-1.5 flex-wrap text-[11px] mb-4">
              {[
                ['🌱 Biomassa+', `${fmt(r.dimensoes.alimentar.ganhoProducaoTon, 1)} t`],
                ['♻️ Resíduo', `${fmt(r.dimensoes.energetico.residuoAproveitadoTon, 1)} t`],
                ['🛢️ Biodigestor', `${fmt(r.dimensoes.energetico.biogasM3Ano)} m³`],
                ['⚡ Energia', `${fmt(r.dimensoes.energetico.energiaBrutaKwhAno)} kWh`],
              ].map(([l, v], i, arr) => (
                <React.Fragment key={l}>
                  <div className="rounded-lg border border-[#00ff6433] bg-[#00ff640d] px-2.5 py-1.5">
                    <div className="text-white/55">{l}</div>
                    <div className="font-bold zd-green">{v}</div>
                  </div>
                  {i < arr.length - 1 && <span className="zd-green">→</span>}
                </React.Fragment>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#ffd70033] bg-[#ffd7000d] p-4">
                <div className="text-xs font-bold text-[#ffd700]">🔥 Rota térmica · {r.dimensoes.energetico.rota.termicaPercentual}%</div>
                <div className="text-sm text-white/75 mt-2">{fmt(r.dimensoes.energetico.energiaTermicaKwhAno)} kWh de cocção limpa</div>
                <div className="text-xs text-white/55 mt-1">
                  {fmt(r.dimensoes.energetico.botijoesGlpEvitadosAno)} botijões de GLP evitados ·
                  <b className="text-white/80"> {fmt(r.dimensoes.energetico.familiasCoccaoLimpaAno)} famílias</b> com fogão limpo
                </div>
              </div>
              <div className="rounded-xl border border-[#00c8ff33] bg-[#00c8ff0d] p-4">
                <div className="text-xs font-bold zd-blue">💡 Rota elétrica · {r.dimensoes.energetico.rota.eletricaPercentual}%</div>
                <div className="text-sm text-white/75 mt-2">{fmt(r.dimensoes.energetico.energiaEletricaKwhAno)} kWh elétricos</div>
                <div className="text-xs text-white/55 mt-1">
                  {fmt(r.dimensoes.energetico.litrosDieselEvitadosAno)} L de diesel evitados ·
                  <b className="text-white/80"> {fmt(r.dimensoes.energetico.domiciliosRuraisAtendidosAno)} domicílios</b> rurais
                </div>
              </div>
            </div>

            <div className="text-[11px] text-white/40 mt-3 leading-relaxed">⚖️ {r.dimensoes.energetico.balanco}</div>
            <div className="text-[11px] zd-green mt-1.5 leading-relaxed">🤝 {r.dimensoes.energetico.justica}</div>
          </div>

          {/* ODS */}
          <div className="zd-card rounded-2xl p-5">
            <h3 className="font-heading font-bold mb-1">🇺🇳 Alinhamento com a Agenda 2030 da ONU</h3>
            <p className="text-xs text-white/50 mb-4">Cada ODS abaixo é justificado por um número da simulação — não por declaração.</p>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {r.ods.map(o => (
                <div key={o.ods} className="rounded-lg bg-white/[.04] border border-white/8 p-3 flex gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#00c8ff1a] border border-[#00c8ff33] flex items-center justify-center font-heading font-bold text-sm zd-blue shrink-0">
                    {o.ods}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold">{o.nome}</div>
                    <div className="text-[11px] text-white/50 mt-0.5 leading-snug">{o.motivo}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BIOGEN + conformidade */}
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="zd-card rounded-2xl p-5 border-[#a855f733]">
              <h3 className="font-heading font-bold">🪙 Potencial BIOGEN</h3>
              <div className="font-heading text-3xl font-bold mt-2" style={{ color: '#a855f7' }}>
                {fmt(r.biogen.biogenPotencial, 1)} <span className="text-sm text-white/40">BGN</span>
              </div>
              <div className="text-xs text-white/55 mt-1">
                {fmt(r.biogen.co2eElegivelTon, 1)} tCO₂e elegíveis − {r.biogen.bufferReversaoPercentual}% de buffer de reversão
              </div>
              <div className="text-[11px] text-white/40 mt-3 leading-relaxed">{r.biogen.condicao}</div>
            </div>
            <div className="zd-card rounded-2xl p-5">
              <h3 className="font-heading font-bold flex items-center gap-2">
                🛡️ Conformidade <SeloBadge selo={r.selo} selos={selos} mini />
              </h3>
              <p className="text-xs text-white/60 mt-2 leading-relaxed">{r.conformidade}</p>
              <div className="text-[11px] text-white/40 mt-3 leading-relaxed">
                Modo <b className="text-white/70">{r.dimensoes.carbono.modo}</b>. Comunicação sempre como
                "emissões compensadas com créditos verificados" — nunca "carbono neutro" genérico (ISO 14068-1 / CONAR).
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Programa INCEMA (dados verificados) ─────────────────────────────────────
function ProgramaFomento({ selos }) {
  const [f, setF] = useState(null);
  const [agregado, setAgregado] = useState(null);

  useEffect(() => {
    api.fomento().then(setF).catch(() => {});
    api.simularPrograma().then(setAgregado).catch(() => {});
  }, []);

  if (!f) return <div className="text-white/40 text-sm">Carregando programa…</div>;

  return (
    <div className="space-y-5">
      <div className="zd-card-glow rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h3 className="font-heading font-bold">{f.programa.nome}</h3>
            <p className="text-xs text-white/50 mt-1">{f.programa.instrumento}</p>
          </div>
          <SeloBadge selo={f.programa.selo} selos={selos} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <Metrica emoji="💵" valor={brl(f.programa.valorGlobal)} unidade="" label="Valor global do fomento" />
          <Metrica emoji="👨‍👩‍👧" valor={fmt(f.beneficiarios.familias)} unidade="famílias" label={`em ${f.beneficiarios.entidades} entidades`} cor="#00c8ff" />
          <Metrica emoji="🌾" valor={fmt(f.beneficiarios.hectaresDeclarados)} unidade="ha" label={`${f.cobertura.percentualEstado}% da área agrícola mapeada do AP`} cor="#ffd700" />
          <Metrica emoji="🛢️" valor={fmt(f.insumo.litrosContratados)} unidade="litros" label={`${f.insumo.litrosPorHectare} L/ha · ${fmt(f.insumo.hectaresAplicacao)} ha-aplicação`} cor="#a855f7" />
        </div>
        <div className="text-[11px] text-white/40 mt-3">
          Verificação: {f.programa.verificacao} · Motivação: {f.programa.motivacao}
        </div>
      </div>

      {agregado && (
        <div className="zd-card-glow rounded-2xl p-5">
          <h3 className="font-heading font-bold">🌍 Impacto agregado projetado do programa</h3>
          <p className="text-xs text-white/50 mt-1 mb-4">Cenário conservador aplicado às áreas declaradas no Plano de Trabalho.</p>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Metrica emoji="🍽️" valor={fmt(agregado.agregado.pessoasAlimentadasAno)} unidade="pessoas/ano" label="Segurança alimentar" />
            <Metrica emoji="⚡" valor={fmt(agregado.agregado.energiaKwhAno)} unidade="kWh/ano" label="Energia limpa potencial" cor="#00c8ff" />
            <Metrica emoji="🌳" valor={fmt(agregado.agregado.co2eSequestradoTonAno)} unidade="tCO₂e" label="Sequestro adicional" />
            <Metrica emoji="🚫" valor={fmt(agregado.agregado.co2eEvitadoTonAno)} unidade="tCO₂e" label="Emissão evitada" cor="#00c8ff" />
            <Metrica emoji="💰" valor={brl(agregado.agregado.impactoEconomicoReais)} unidade="" label="Impacto econômico/ano" cor="#ffd700" />
          </div>
          <div className="text-[11px] text-white/40 mt-3">{agregado.aviso}</div>
        </div>
      )}

      <Secao titulo="Pilares de impacto (PNDR/MIDR)" sub="Declarados na Nota Informativa nº 4/2024 e no Plano de Trabalho">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {f.pilares.map(p => (
            <div key={p.id} className="zd-card rounded-xl p-4">
              <div className="text-sm font-bold">{p.nome}</div>
              <p className="text-[11px] text-white/55 mt-1 leading-snug">{p.descricao}</p>
              <div className="text-[10px] text-white/30 mt-2">{p.fonte}</div>
            </div>
          ))}
        </div>
      </Secao>

      <Secao titulo={`Beneficiários — ${f.entidades.length} entidades`}
        sub={`${f.cobertura.entidadesQuilombolasIndigenas} quilombolas/indígenas · ${f.cobertura.entidadesExtrativistas} extrativistas`}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {f.entidades.map(e => (
            <div key={e.sigla} className="zd-card rounded-lg px-3 py-2.5 flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold truncate">{e.sigla}</div>
                <div className="text-[10px] text-white/45 truncate">{e.nome}</div>
              </div>
              <div className="flex gap-1 shrink-0">
                {e.quilombola && <span title="Quilombola" className="text-xs">✊🏿</span>}
                {e.indigena && <span title="Indígena" className="text-xs">🪶</span>}
                {e.extrativista && <span title="Extrativista" className="text-xs">🌿</span>}
              </div>
            </div>
          ))}
        </div>
      </Secao>

      <Secao titulo="Monitoramento independente" sub="Credibilidade de MRV exige olhos externos ao fabricante">
        <div className="zd-card rounded-xl p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="font-bold text-sm">{f.monitoramento.instituicao}</div>
              <div className="text-xs text-white/50 mt-0.5">{f.monitoramento.programa}</div>
            </div>
            <SeloBadge selo={f.monitoramento.selo} selos={selos} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <Metrica emoji="🎓" valor={f.monitoramento.estudantes} unidade="estudantes" label="de agronomia em campo" cor="#00c8ff" />
            <Metrica emoji="🏢" valor={f.monitoramento.cooperativasMonitoradas} unidade="cooperativas" label="monitoradas" />
            <Metrica emoji="📍" valor={f.monitoramento.municipios} unidade="municípios" label="cobertos" cor="#ffd700" />
            <Metrica emoji="👥" valor={`${f.monitoramento.estudantesCapacitadosPrograma}+`} unidade="" label="capacitados no programa" cor="#a855f7" />
          </div>
          <p className="text-[11px] text-white/45 mt-3 leading-relaxed">{f.monitoramento.metodo}</p>
          <p className="text-[11px] zd-green mt-1.5">{f.monitoramento.relevancia}</p>
        </div>
      </Secao>

      {f.inconsistencias?.length > 0 && (
        <Secao titulo="⚠️ Divergências documentais detectadas" sub="A plataforma nunca escolhe um número em silêncio">
          {f.inconsistencias.map(i => (
            <div key={i.id} className="rounded-xl border border-[#ff9f4344] bg-[#ff9f430d] p-4">
              <div className="text-sm font-bold text-[#ff9f43]">{i.campo}</div>
              <div className="text-xs text-white/65 mt-1.5">
                Declarado na fonte: <b>{fmt(i.declarado)} {i.unidade}</b> · Soma dos itens listados: <b>{fmt(i.calculado)} {i.unidade}</b>
              </div>
              <div className="text-[11px] text-white/50 mt-2 leading-relaxed">{i.tratamento}</div>
              <div className="text-[10px] text-white/30 mt-1.5">Fonte: {i.fonte}</div>
            </div>
          ))}
        </Secao>
      )}
    </div>
  );
}

// ── Dossiê científico ───────────────────────────────────────────────────────
function Dossie({ dossie }) {
  const [filtro, setFiltro] = useState('todas');
  const selos = dossie?.selos || [];
  const cats = useMemo(() => {
    const c = [...new Set((dossie?.evidencias || []).map(e => e.categoria))];
    return ['todas', ...c];
  }, [dossie]);
  const LABEL = { todas: 'Todas', regulatorio: 'Regulatório', institucional: 'Institucional', agronomico: 'Agronômico', ambiental: 'Ambiental', modelo: 'Modelo de negócio', mecanismo: 'Mecanismo' };

  if (!dossie) return <div className="text-white/40 text-sm">Carregando dossiê…</div>;
  const lista = filtro === 'todas' ? dossie.evidencias : dossie.evidencias.filter(e => e.categoria === filtro);

  return (
    <div className="space-y-5">
      <div className="zd-card-glow rounded-2xl p-5">
        <h3 className="font-heading font-bold">{dossie.identidade.marca}</h3>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 mt-3 text-xs">
          {[
            ['Classe', dossie.identidade.classe],
            ['Registro MAPA', dossie.identidade.registroMapa],
            ['Registrante', dossie.identidade.registrante],
            ['Fabricante', dossie.identidade.fabricante],
            ['Desenvolvedor', dossie.identidade.desenvolvedor],
            ['Dosagem', `${dossie.identidade.dosagem.litrosPorHectare} L/ha · ${dossie.identidade.dosagem.aplicacoesPorCiclo} aplicações · ${dossie.identidade.dosagem.intervaloDias} dias`],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <span className="text-white/40 shrink-0">{k}:</span><span className="text-white/80">{v}</span>
            </div>
          ))}
        </div>
        <div className="text-[11px] text-white/40 mt-3 leading-relaxed">
          Identidade histórica nos laudos: <b className="text-white/60">{dossie.identidade.nomeHistorico}</b>.
          Em contexto técnico e regulatório citamos sempre o registro legal — marca não sobrescreve registro.
        </div>
      </div>

      <div className="zd-card rounded-2xl p-5">
        <h3 className="font-heading font-bold text-sm mb-3">Escala do Selo de Evidência</h3>
        <div className="space-y-1.5">
          {selos.map(s => (
            <div key={s.id} className="flex items-center gap-3 rounded-lg bg-white/[.03] px-3 py-2">
              <div className="w-24 shrink-0"><SeloBadge selo={s.id} selos={selos} mini /></div>
              <div className="flex-1 min-w-0 text-[11px] text-white/55 leading-snug">{s.descricao}</div>
              <div className="flex gap-1.5 shrink-0 text-[10px]">
                <span className={s.usoComercial ? 'zd-tag rounded px-1.5 py-0.5' : 'rounded px-1.5 py-0.5 border border-white/10 text-white/30'}>comercial</span>
                <span className={s.usoCredito ? 'zd-tag-blue rounded px-1.5 py-0.5' : 'rounded px-1.5 py-0.5 border border-white/10 text-white/30'}>crédito</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {cats.map(c => (
          <button key={c} onClick={() => setFiltro(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtro === c ? 'text-[#00ff64] bg-[#00ff6414] border border-[#00ff6433]' : 'text-white/50 hover:text-white/85 hover:bg-white/5 border border-transparent'}`}>
            {LABEL[c] || c}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {lista.map(e => (
          <div key={e.id} className="zd-card rounded-xl p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <p className="text-sm text-white/85 flex-1 min-w-[240px] leading-relaxed">{e.alegacao}</p>
              <SeloBadge selo={e.selo} selos={selos} />
            </div>
            <div className="text-[11px] text-white/45 mt-2.5"><b className="text-white/60">Fonte:</b> {e.fonte}</div>
            <div className="text-[11px] text-white/45 mt-1"><b className="text-white/60">Verificação:</b> {e.verificacao}</div>
            {e.contexto && (
              <div className="text-[11px] text-white/55 mt-2 rounded-lg bg-white/[.04] border border-white/8 px-3 py-2 leading-relaxed">
                💡 {e.contexto}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── BIOGEN ──────────────────────────────────────────────────────────────────
function Biogen({ selos }) {
  const [b, setB] = useState(null);
  useEffect(() => { api.biogen().then(setB).catch(() => {}); }, []);
  if (!b) return <div className="text-white/40 text-sm">Carregando…</div>;

  return (
    <div className="space-y-5">
      <div className="zd-card-glow rounded-2xl p-6 border-[#a855f733]">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border border-[#a855f755]"
            style={{ background: 'linear-gradient(135deg,#a855f722,#00ff6422)' }}>🪙</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-xl font-bold">{b.nome} <span className="text-sm text-white/40">({b.simbolo})</span></h3>
            <p className="text-xs text-white/55">{b.subtitulo} · lastreado na tecnologia {b.tecnologia}</p>
          </div>
          <span className="rounded-full px-3 py-1.5 text-xs font-bold border border-[#ff9f4355] text-[#ff9f43] bg-[#ff9f430d]">
            {b.compliance.status}
          </span>
        </div>
        <div className="mt-4 rounded-xl border border-[#00ff6433] bg-[#00ff640d] p-4">
          <div className="text-xs font-bold zd-green mb-1">PRINCÍPIO</div>
          <p className="text-sm text-white/85 leading-relaxed">{b.principio}</p>
        </div>
      </div>

      <Secao titulo="Lastro em camadas" sub="Nenhuma unidade nasce sem evidência">
        <div className="grid md:grid-cols-3 gap-3">
          {b.lastro.map(l => (
            <div key={l.camada} className="zd-card rounded-xl p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="text-sm font-bold">{l.camada}</div>
                <SeloBadge selo={l.selo} selos={selos} mini />
              </div>
              <p className="text-[11px] text-white/55 leading-snug">{l.descricao}</p>
              <div className="text-[10px] mt-2" style={{ color: l.exigeMRV ? '#00c8ff' : '#ffffff55' }}>
                {l.exigeMRV ? '🔬 exige MRV instrumentado' : '📄 laudo técnico'}
              </div>
            </div>
          ))}
        </div>
      </Secao>

      <Secao titulo="Ciclo de vida de 1 BIOGEN" sub="Da aplicação em campo à aposentadoria pública do crédito">
        <div className="space-y-2">
          {b.ciclo.map(c => (
            <div key={c.etapa} className="zd-card rounded-xl p-3.5 flex gap-3 items-start">
              <div className="w-7 h-7 rounded-lg bg-[#00ff641a] border border-[#00ff6433] flex items-center justify-center font-heading font-bold text-xs zd-green shrink-0">
                {c.etapa}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold">{c.nome}</div>
                <div className="text-[11px] text-white/55 mt-0.5 leading-snug">{c.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Secao>

      <div className="grid lg:grid-cols-2 gap-4">
        <Secao titulo="🛡️ Integridade" sub="Anti-greenwashing e anti-dupla-contagem">
          <div className="zd-card rounded-xl p-4">
            <ul className="space-y-2">
              {b.integridade.map((i, k) => (
                <li key={k} className="text-[11px] text-white/65 flex gap-2 leading-relaxed"><span className="zd-green shrink-0">▸</span>{i}</li>
              ))}
            </ul>
          </div>
        </Secao>
        <Secao titulo="⚖️ Travas de compliance" sub="O que precisa existir ANTES de qualquer emissão">
          <div className="rounded-xl border border-[#ff9f4344] bg-[#ff9f430d] p-4">
            <ul className="space-y-2">
              {b.compliance.travas.map((t, k) => (
                <li key={k} className="text-[11px] text-white/70 flex gap-2 leading-relaxed"><span className="text-[#ff9f43] shrink-0">🔒</span>{t}</li>
              ))}
            </ul>
            <p className="text-[11px] zd-green mt-3 italic leading-relaxed">"{b.compliance.principioFundador}"</p>
          </div>
        </Secao>
      </div>

      <Secao titulo="Utilidade no ecossistema ZoomDev">
        <div className="grid sm:grid-cols-2 gap-2.5">
          {b.utilidade.map((u, k) => (
            <div key={k} className="zd-card rounded-lg px-3.5 py-3 text-[11px] text-white/65 flex gap-2 leading-relaxed">
              <span className="zd-green shrink-0">◈</span>{u}
            </div>
          ))}
        </div>
      </Secao>
    </div>
  );
}

// ── Página ──────────────────────────────────────────────────────────────────
export default function Impacto() {
  const [dossie, setDossie] = useState(null);
  const [tab, setTab] = useState('simulador');

  useEffect(() => { api.biogenesis().then(setDossie).catch(() => {}); }, []);

  const TABS = [
    ['simulador', '🌍 Simulador 360°'],
    ['programa', '🏛️ Programa INCEMA'],
    ['dossie', '🔬 Dossiê científico'],
    ['biogen', '🪙 BIOGEN'],
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">
          Impacto <span className="zd-gradient-text">Regenerativo 360°</span>
        </h1>
        <p className="text-white/55 text-sm mt-1.5">
          Biogenesis COT BioTechnology aplicada a segurança alimentar, transição energética justa,
          carbono e bioeconomia — com cada número ancorado em evidência rastreável.
        </p>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-3.5 py-2 rounded-lg text-[13px] font-medium transition-colors ${tab === id ? 'text-[#00ff64] bg-[#00ff6414] border border-[#00ff6433]' : 'text-white/50 hover:text-white/85 hover:bg-white/5 border border-transparent'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'simulador' && <Simulador dossie={dossie} />}
      {tab === 'programa' && <ProgramaFomento selos={dossie?.selos} />}
      {tab === 'dossie' && <Dossie dossie={dossie} />}
      {tab === 'biogen' && <Biogen selos={dossie?.selos} />}
    </div>
  );
}
