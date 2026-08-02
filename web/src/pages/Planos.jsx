import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useUser } from '../App.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// PLANOS E SEIVA: assinatura via Stripe, avulso via PIX.
// Quando as chaves não estão configuradas, o fluxo é o mesmo e a confirmação
// é manual: nada de tela morta esperando produção.
// ═══════════════════════════════════════════════════════════════════════════

const brl = (v) => `R$ ${Number(v).toLocaleString('pt-BR')}`;

function ModalPix({ tx, onFechar, onConfirmar, confirmando }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = () => {
    navigator.clipboard?.writeText(tx.pix.payload).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2200);
    }).catch(() => {});
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4" onClick={onFechar}>
      <div className="zd-card-glow rounded-2xl p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="text-center">
          <div className="font-heading font-bold text-lg">Pague com PIX</div>
          <p className="text-xs text-white/50 mt-1">{tx.descricao}</p>
          <div className="font-heading text-3xl font-bold zd-green mt-3">{brl(tx.valor)}</div>
        </div>

        {tx.pix.qr && (
          <img src={tx.pix.qr} alt="QR Code PIX" className="w-52 h-52 mx-auto mt-4 rounded-xl bg-white p-2" />
        )}

        <div className="mt-4">
          <div className="text-[11px] text-white/50 mb-1.5">Ou copie o código:</div>
          <div className="rounded-lg bg-black/40 border border-white/10 p-2.5 text-[9px] font-mono text-white/60 break-all max-h-24 overflow-y-auto">
            {tx.pix.payload}
          </div>
          <button onClick={copiar} className="w-full rounded-lg border border-[#00c8ff44] text-[#00c8ff] hover:bg-[#00c8ff12] transition-colors py-2.5 text-sm font-semibold mt-2">
            {copiado ? '✓ Copiado!' : '📋 Copiar código PIX'}
          </button>
        </div>

        <div className="text-[10px] text-white/40 mt-3 text-center">
          Beneficiário: {tx.pix.beneficiario} · expira em 1 hora
        </div>

        {tx.simulado ? (
          <>
            <button onClick={onConfirmar} disabled={confirmando} className="zd-gradient-btn w-full rounded-lg py-3 text-sm mt-4">
              {confirmando ? 'Confirmando…' : 'Já paguei: liberar agora'}
            </button>
            <p className="text-[10px] text-white/35 mt-2 text-center">
              Conciliação automática ainda não configurada: a confirmação é manual.
            </p>
          </>
        ) : (
          <p className="text-[11px] text-white/50 mt-4 text-center">
            Assim que o pagamento cair, seu saldo é liberado automaticamente.
          </p>
        )}

        <button onClick={onFechar} className="w-full text-white/40 hover:text-white/70 text-xs mt-3">Fechar</button>
      </div>
    </div>
  );
}

export default function Planos() {
  const { user, refreshUser } = useUser();
  const [planos, setPlanos] = useState([]);
  const [pacotes, setPacotes] = useState([]);
  const [status, setStatus] = useState(null);
  const [transacoes, setTransacoes] = useState([]);
  const [pix, setPix] = useState(null);
  const [carregando, setCarregando] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState(null);
  const [aviso, setAviso] = useState(null);

  const carregar = () => {
    api.pagamentosPlanos().then(setPlanos).catch(() => {});
    api.pagamentosPacotes().then(setPacotes).catch(() => {});
    api.pagamentosStatus().then(setStatus).catch(() => {});
    api.transacoes().then(setTransacoes).catch(() => {});
  };
  useEffect(() => { carregar(); }, []);

  const assinar = async (planoId) => {
    setErro(null); setAviso(null); setCarregando(planoId);
    try {
      const t = await api.assinar(planoId);
      if (!t.simulado && t.url) { window.location.href = t.url; return; }
      const r = await api.confirmarPagamento(t.id);
      await refreshUser();
      carregar();
      setAviso(`Plano ${planoId.toUpperCase()} ativado. Saldo agora: 🌿 ${r.creditos}`);
    } catch (e) { setErro(e.message); }
    finally { setCarregando(null); }
  };

  const comprarSeiva = async (pacoteId) => {
    setErro(null); setAviso(null); setCarregando(pacoteId);
    try { setPix(await api.comprarSeiva(pacoteId)); }
    catch (e) { setErro(e.message); }
    finally { setCarregando(null); }
  };

  const confirmarPix = async () => {
    setConfirmando(true);
    try {
      const r = await api.confirmarPagamento(pix.id);
      await refreshUser();
      carregar();
      setPix(null);
      setAviso(`Pagamento confirmado. Saldo agora: 🌿 ${r.creditos}`);
    } catch (e) { setErro(e.message); }
    finally { setConfirmando(false); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-7">
      <div>
        <h1 className="font-heading text-2xl font-bold">Planos e <span className="zd-gradient-text">Seiva</span></h1>
        <p className="text-white/55 text-sm mt-1.5">
          Assinatura mensal pelos planos, ou seiva avulsa via PIX quando precisar de um empurrão.
          Custo exibido antes de cada ação e estorno automático quando a IA falha.
        </p>
      </div>

      {erro && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{erro}</div>}
      {aviso && <div className="zd-notification rounded-lg px-4 py-3 text-sm">{aviso}</div>}

      <div className="zd-card-glow rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs text-white/50">Seu saldo</div>
          <div className="font-heading text-3xl font-bold zd-green mt-0.5">🌿 {user.creditos}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-white/50">Plano atual</div>
          <div className="font-heading text-xl font-bold mt-0.5 uppercase">{user.plano}</div>
        </div>
      </div>

      <section>
        <h2 className="font-heading text-lg font-bold mb-3">Assinatura mensal</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {planos.map(p => (
            <div key={p.id} className={`rounded-2xl p-5 flex flex-col border ${
              p.id === 'pro' ? 'border-[#00ff64] bg-[#00ff640d] zd-glow-green' : 'border-white/10 bg-white/[.03]'}`}>
              {p.id === 'pro' && <div className="zd-tag rounded-full px-2.5 py-1 self-start mb-2">mais escolhido</div>}
              <div className="font-heading font-bold text-lg">{p.nome}</div>
              <div className="font-heading text-3xl font-bold mt-2">
                {p.preco === 0 ? 'Grátis' : brl(p.preco)}
                {p.preco > 0 && <span className="text-xs text-white/40 font-normal">/mês</span>}
              </div>
              <div className="text-xs zd-green mt-1">🌿 {p.creditos.toLocaleString('pt-BR')} de seiva</div>
              <p className="text-xs text-white/55 mt-3 flex-1">{p.descricao}</p>
              {p.atual ? (
                <div className="rounded-lg border border-white/15 text-white/50 py-2.5 text-sm text-center mt-4">Plano atual</div>
              ) : p.preco === 0 ? (
                <div className="rounded-lg border border-white/10 text-white/30 py-2.5 text-sm text-center mt-4">Incluído</div>
              ) : (
                <button onClick={() => assinar(p.id)} disabled={carregando === p.id}
                  className={`rounded-lg py-2.5 text-sm font-semibold mt-4 ${p.id === 'pro' ? 'zd-gradient-btn' : 'border border-white/15 text-white/75 hover:bg-white/5 transition-colors'}`}>
                  {carregando === p.id ? 'Abrindo…' : 'Assinar'}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold mb-1">Seiva avulsa</h2>
        <p className="text-xs text-white/45 mb-3">Sem assinatura, sem recorrência. Pague por PIX e use quando quiser.</p>
        <div className="grid md:grid-cols-3 gap-4">
          {pacotes.map(p => (
            <div key={p.id} className={`zd-card rounded-2xl p-5 flex flex-col ${p.destaque ? 'border-[#00c8ff44]' : ''}`}>
              <div className="font-heading font-bold">{p.nome}</div>
              <div className="font-heading text-2xl font-bold zd-blue mt-1.5">{brl(p.preco)}</div>
              <p className="text-xs text-white/50 mt-2 flex-1">{p.descricao}</p>
              <button onClick={() => comprarSeiva(p.id)} disabled={carregando === p.id}
                className="rounded-lg border border-[#00c8ff44] text-[#00c8ff] hover:bg-[#00c8ff12] transition-colors py-2.5 text-sm font-semibold mt-4">
                {carregando === p.id ? 'Gerando PIX…' : '⚡ Comprar com PIX'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {transacoes.length > 0 && (
        <section>
          <h2 className="font-heading text-lg font-bold mb-3">Histórico</h2>
          <div className="zd-card rounded-xl overflow-hidden">
            {transacoes.map(t => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3 border-b border-white/6 last:border-0 flex-wrap">
                <span className="text-base">{t.metodo === 'pix' ? '⚡' : '💳'}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm">{t.descricao}</div>
                  <div className="text-[10px] text-white/40">
                    {new Date(t.criadoEm).toLocaleString('pt-BR')} · {t.metodo}
                    {t.comprovante && ` · ${t.comprovante.slice(0, 12)}`}
                  </div>
                </div>
                <div className="text-sm font-bold">{brl(t.valor)}</div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                  t.status === 'pago' ? 'bg-[#00ff641a] text-[#00ff64]' :
                  t.status === 'cancelada' ? 'bg-white/5 text-white/40' : 'bg-[#ffd7001a] text-[#ffd700]'}`}>
                  {t.status.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {status && (
        <div className="zd-card rounded-xl p-4 text-[11px] text-white/45 space-y-1">
          <div className="font-bold text-white/60 uppercase text-[10px] tracking-wider mb-1.5">Integração de pagamentos</div>
          <div>💳 Stripe: <b className={status.stripe.ativo ? 'zd-green' : 'text-white/50'}>{status.stripe.modo}</b>
            {!status.stripe.ativo && `: ${status.stripe.comoAtivar}`}</div>
          <div>⚡ PIX: <b className={status.pix.ativo ? 'zd-green' : 'text-white/50'}>{status.pix.modo}</b>
            {!status.pix.ativo && `: ${status.pix.comoAtivar}`}</div>
          <div className="text-white/30 pt-1">O BR Code do PIX já é gerado no padrão do Banco Central, com CRC16 válido.</div>
        </div>
      )}

      <div className="zd-card rounded-xl p-5 text-center text-xs text-white/45">
        Cancelamento em 1 clique, sem fidelidade. Seiva ganha em missões nunca expira.
      </div>

      {pix && <ModalPix tx={pix} onFechar={() => setPix(null)} onConfirmar={confirmarPix} confirmando={confirmando} />}
    </div>
  );
}
