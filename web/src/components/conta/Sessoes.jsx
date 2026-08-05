import React, { useCallback, useEffect, useState } from 'react';
import Icon from '../Icon.jsx';
import { Painel, Etiqueta, Botao } from '../hud/index.jsx';
import { api, setToken } from '../../lib/api.js';

// ═══════════════════════════════════════════════════════════════════════════
// APARELHOS CONECTADOS
//
// Um componente, dois lugares: Configurações, onde é a conta de quem quer que
// seja, e Administração, onde é a conta com o maior poder da plataforma. São
// os mesmos dados e as mesmas regras; duplicar a tela garantiria que uma das
// duas ficasse para trás.
//
// Três ações, em ordem de força:
//
//   DESCONECTAR ESTE   um aparelho, o que você reconheceu na lista
//   ENCERRAR AS OUTRAS todas menos a sua, para o susto do computador esquecido
//   SAIR DE TODOS      inclusive esta, para quando o esquecido é este aqui
//
// A lista nunca traz o token de sessão nenhuma. Ela traz um resumo do token,
// que serve para dizer "encerre esta" e não serve para entrar.
// ═══════════════════════════════════════════════════════════════════════════

export default function Sessoes({ onSaiuDeTudo, compacto = false }) {
  const [lista, setLista] = useState(null);
  const [ocupado, setOcupado] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    try { setLista((await api.sessoes()).sessoes); setErro(null); }
    catch (e) { setLista([]); setErro(e.message); }
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const sairDaConta = () => {
    if (onSaiuDeTudo) onSaiuDeTudo();
    else { setToken(null); window.location.assign('/entrar'); }
  };

  const desconectar = async (s) => {
    setOcupado(s.id); setAviso(null); setErro(null);
    try {
      const r = await api.desconectarSessao(s.id);
      if (r.eraAtual) { sairDaConta(); return; }
      setAviso(`${r.aparelho} foi desconectado.`);
      await carregar();
    } catch (e) { setErro(e.message); }
    finally { setOcupado(null); }
  };

  const encerrar = async (manterAtual) => {
    setOcupado('todas'); setAviso(null); setErro(null);
    try {
      const r = await api.encerrarSessoes(manterAtual);
      if (!manterAtual) { sairDaConta(); return; }
      setAviso(r.encerradas === 0
        ? 'Nenhum outro aparelho estava conectado.'
        : `${r.encerradas} aparelho(s) desconectado(s). Este continua conectado.`);
      await carregar();
    } catch (e) { setErro(e.message); }
    finally { setOcupado(null); }
  };

  const outras = (lista || []).filter(s => !s.atual).length;

  return (
    <Painel className={compacto ? 'p-4 space-y-3.5' : 'p-5 space-y-4'}>
      {lista === null ? (
        <div className="text-[12px] text-white/40">Lendo os aparelhos conectados…</div>
      ) : lista.length === 0 ? (
        <div className="text-[12px] text-white/40">Nenhuma sessão aberta encontrada.</div>
      ) : (
        <div className="space-y-1">
          {lista.map(s => (
            <div key={s.id}
              className="flex items-center gap-3 flex-wrap py-1.5 px-2 -mx-2 text-[12px]
                         hover:bg-white/[.03] transition-colors">
              <Icon nome={s.atual ? 'check' : 'cadeadoAberto'} tam={14}
                className={s.atual ? 'text-[color:var(--zd-marca)]' : 'text-white/25'} />
              <span className="text-white/80">{s.aparelho}</span>
              {s.atual && <Etiqueta cor="#00ff64">este aparelho</Etiqueta>}

              <span className="hud-tec text-[9.5px] text-white/28 ml-auto whitespace-nowrap">
                desde {new Date(s.criadoEm).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: '2-digit', year: '2-digit',
                })}
              </span>

              <button
                onClick={() => desconectar(s)}
                disabled={ocupado !== null}
                title={s.atual ? 'Sair neste aparelho' : `Desconectar ${s.aparelho}`}
                className="hud-tec text-[9.5px] uppercase tracking-[.12em] px-2 py-1
                           text-white/35 hover:text-[#ff4d8d] transition-colors disabled:opacity-30"
              >
                {ocupado === s.id ? '…' : s.atual ? 'sair' : 'desconectar'}
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10.5px] text-white/35 leading-relaxed">
        Guardamos apenas o navegador e o sistema, nunca o endereço de onde você acessou.
        Sessão sem uso por 30 dias cai sozinha.
      </p>

      <div className="flex items-center gap-3 flex-wrap">
        <Botao onClick={() => encerrar(true)} disabled={ocupado !== null || outras === 0}
          className="px-4 py-2 text-xs">
          <Icon nome="escudo" tam={13} />
          {outras === 0 ? 'Só este aparelho' : `Encerrar as outras (${outras})`}
        </Botao>
        <button onClick={() => encerrar(false)} disabled={ocupado !== null}
          className="text-[11px] text-white/35 hover:text-[#ff4d8d] transition-colors px-2 py-1.5">
          sair de todos, inclusive deste
        </button>
      </div>

      {aviso && <div className="text-[11.5px] zd-green">{aviso}</div>}
      {erro && <div className="text-[11.5px] text-[#ff4d8d]">{erro}</div>}
    </Painel>
  );
}
