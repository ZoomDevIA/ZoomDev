import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import BrandLockup from '../components/BrandLockup.jsx';
import Icon from '../components/Icon.jsx';
import { Painel, Botao, Campo, Rotulo } from '../components/hud/index.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// REDEFINIR SENHA — a segunda metade do caminho de volta.
//
// Chega aqui por link de e-mail com o token na URL. A tela não sabe de quem é
// a conta e não precisa saber: o servidor resolve isso pelo token.
// ═══════════════════════════════════════════════════════════════════════════

export default function Redefinir() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const token = params.get('token') || '';

  const [senha, setSenha] = useState('');
  const [repetir, setRepetir] = useState('');
  const [erro, setErro] = useState(null);
  const [pronto, setPronto] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const curta = senha.length > 0 && senha.length < 8;
  const diferem = repetir.length > 0 && senha !== repetir;
  const valido = senha.length >= 8 && senha === repetir;

  const enviar = async (e) => {
    e.preventDefault();
    if (!valido) return;
    setErro(null); setEnviando(true);
    try {
      await api.redefinirSenha({ token, senha });
      setPronto(true);
      setTimeout(() => nav('/entrar'), 2600);
    } catch (err) {
      setErro(err.message);
    } finally { setEnviando(false); }
  };

  return (
    <div className="min-h-screen zd-bg zd-circuit-bg hud-grade hud-scan flex items-center justify-center p-6">
      <div className="w-full max-w-sm relative z-10">
        <BrandLockup symbolSize={38} wordmarkHeight={30} className="justify-center mb-6" />

        <Painel aceso quatroCantos className="p-7">
          {!token ? (
            <div className="text-center space-y-3">
              <Icon nome="alerta" tam={34} className="text-[#ff4d8d] mx-auto" />
              <h1 className="font-heading text-lg font-bold">Link incompleto</h1>
              <p className="text-white/50 text-[13px]">
                Este endereço não traz o código de redefinição. Peça um link novo na tela de entrada.
              </p>
            </div>
          ) : pronto ? (
            <div className="text-center space-y-3">
              <Icon nome="check" tam={34} className="text-[#00ff64] mx-auto" />
              <h1 className="font-heading text-lg font-bold">Senha redefinida</h1>
              <p className="text-white/50 text-[13px]">
                Todas as sessões abertas foram encerradas. Levando você para a entrada…
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <Icon nome="cadeadoAberto" tam={32} className="text-[color:var(--zd-acento)] mx-auto mb-2" />
                <h1 className="font-heading text-lg font-bold">Definir nova senha</h1>
                <p className="text-white/50 text-[13px] mt-1.5">
                  Escolha uma senha nova. Ao confirmar, todas as sessões abertas nesta conta se encerram.
                </p>
              </div>

              {erro && (
                <div className="text-sm text-[#ff4d8d] bg-[#ff4d8d14] px-3 py-2 mb-4 hud-corte"
                  style={{ '--c': '6px', boxShadow: 'inset 0 0 0 1px #ff4d8d40' }}>
                  {erro}
                </div>
              )}

              <form onSubmit={enviar} className="space-y-3">
                <div>
                  <Rotulo className="mb-1.5">NOVA SENHA</Rotulo>
                  <Campo type="password" required autoFocus autoComplete="new-password"
                    className="w-full px-3 py-2.5 text-sm" placeholder="mínimo 8 caracteres"
                    value={senha} onChange={e => setSenha(e.target.value)} />
                  {curta && <div className="text-[11px] text-[#ffc531] mt-1">Faltam {8 - senha.length} caracteres.</div>}
                </div>
                <div>
                  <Rotulo className="mb-1.5">REPITA</Rotulo>
                  <Campo type="password" required autoComplete="new-password"
                    className="w-full px-3 py-2.5 text-sm" placeholder="a mesma senha"
                    value={repetir} onChange={e => setRepetir(e.target.value)} />
                  {diferem && <div className="text-[11px] text-[#ff4d8d] mt-1">As senhas não conferem.</div>}
                </div>
                <Botao type="submit" disabled={!valido || enviando} className="w-full py-3 text-sm">
                  <Icon nome="check" tam={15} /> {enviando ? 'Salvando…' : 'Definir nova senha'}
                </Botao>
              </form>
            </>
          )}
        </Painel>

        <div className="text-center mt-4">
          <Link to="/entrar" className="text-[11px] text-white/40 hover:text-white/70 transition-colors">
            voltar para a entrada
          </Link>
        </div>
      </div>
    </div>
  );
}
