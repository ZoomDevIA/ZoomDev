import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../App.jsx';
import { api, setToken, baixarMeusDados } from '../lib/api.js';
import Icon from '../components/Icon.jsx';
import Aparencia from '../components/configuracoes/Aparencia.jsx';
import { Painel, Rotulo, Etiqueta, Botao, Campo, Secao, Barra } from '../components/hud/index.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURAÇÕES — a conta nas mãos de quem é dono dela.
//
// Trocar senha, editar o perfil, levar os dados embora e sumir da base sem
// precisar pedir para ninguém. As duas últimas são direito do titular na
// LGPD, artigo 18, e por isso não ficam atrás de suporte.
// ═══════════════════════════════════════════════════════════════════════════

export default function Configuracoes() {
  const { user, setUser, refreshUser } = useUser();

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <Rotulo>SUA CONTA</Rotulo>
        <h1 className="font-heading text-2xl font-bold mt-2">Configurações</h1>
      </div>

      <Perfil user={user} refreshUser={refreshUser} />
      <Aparencia user={user} refreshUser={refreshUser} />
      <TrocarSenha onEncerrou={() => { setToken(null); setUser(null); }} />
      <PlanoECreditos user={user} />
      <Gamificacao user={user} />
      <DadosEPrivacidade user={user} onExcluiu={() => { setToken(null); setUser(null); }} />
    </div>
  );
}

// ── Perfil ────────────────────────────────────────────────────────────────
function Perfil({ user, refreshUser }) {
  const [nome, setNome] = useState(user.nome);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const mudou = nome.trim() !== user.nome && nome.trim().length >= 2;

  const salvar = async () => {
    setSalvando(true); setAviso(null);
    try { await api.atualizarPerfil({ nome: nome.trim() }); await refreshUser(); setAviso('ok'); }
    catch (e) { setAviso(e.message); }
    finally { setSalvando(false); setTimeout(() => setAviso(null), 3000); }
  };

  return (
    <Secao rotulo="PERFIL" titulo="Quem você é na plataforma">
      <Painel className="p-5 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Rotulo className="mb-1.5">NOME</Rotulo>
            <Campo className="w-full px-3 py-2.5 text-sm" value={nome} maxLength={80}
              onChange={e => setNome(e.target.value)} />
          </div>
          <div>
            <Rotulo className="mb-1.5">E-MAIL</Rotulo>
            <Campo className="w-full px-3 py-2.5 text-sm opacity-60" value={user.email} disabled />
            <p className="text-[10px] text-white/30 mt-1.5">
              Trocar o e-mail exige confirmar o endereço novo. Ainda não disponível.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Botao onClick={salvar} disabled={!mudou || salvando} className="px-4 py-2 text-xs">
            <Icon nome="check" tam={13} /> {salvando ? 'Salvando…' : 'Salvar nome'}
          </Botao>
          {aviso === 'ok' && <span className="text-[11px] zd-green">Nome atualizado.</span>}
          {aviso && aviso !== 'ok' && <span className="text-[11px] text-[#ff4d8d]">{aviso}</span>}
          <span className="ml-auto"><Etiqueta cor={user.papelInfo?.cor || '#00e5ff'}>{user.papel}</Etiqueta></span>
        </div>
      </Painel>
    </Secao>
  );
}

// ── Senha ─────────────────────────────────────────────────────────────────
function TrocarSenha({ onEncerrou }) {
  const [f, setF] = useState({ atual: '', nova: '', repetir: '' });
  const [erro, setErro] = useState(null);
  const [pronto, setPronto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const set = (k) => (e) => setF(s => ({ ...s, [k]: e.target.value }));
  const valido = f.atual && f.nova.length >= 8 && f.nova === f.repetir && f.nova !== f.atual;

  const enviar = async (e) => {
    e.preventDefault();
    setErro(null); setEnviando(true);
    try {
      await api.trocarSenha({ atual: f.atual, nova: f.nova });
      setPronto(true);
      // A troca encerra todas as sessões, inclusive esta.
      setTimeout(onEncerrou, 2400);
    } catch (err) { setErro(err.message); setEnviando(false); }
  };

  if (pronto) {
    return (
      <Secao rotulo="SENHA" titulo="Senha alterada">
        <Painel aceso cor="#00ff64" className="p-5 flex items-center gap-3">
          <Icon nome="check" tam={22} className="text-[#00ff64]" />
          <p className="text-sm text-white/70">
            Senha trocada e todas as sessões encerradas. Levando você para a entrada…
          </p>
        </Painel>
      </Secao>
    );
  }

  return (
    <Secao rotulo="SENHA" titulo="Trocar sua senha"
      descricao="Ao confirmar, todas as sessões abertas nesta conta são encerradas, inclusive esta.">
      <Painel className="p-5">
        <form onSubmit={enviar} className="space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Rotulo className="mb-1.5">ATUAL</Rotulo>
              <Campo type="password" required autoComplete="current-password"
                className="w-full px-3 py-2.5 text-sm" value={f.atual} onChange={set('atual')} />
            </div>
            <div>
              <Rotulo className="mb-1.5">NOVA</Rotulo>
              <Campo type="password" required autoComplete="new-password" placeholder="mínimo 8"
                className="w-full px-3 py-2.5 text-sm" value={f.nova} onChange={set('nova')} />
            </div>
            <div>
              <Rotulo className="mb-1.5">REPITA</Rotulo>
              <Campo type="password" required autoComplete="new-password"
                className="w-full px-3 py-2.5 text-sm" value={f.repetir} onChange={set('repetir')} />
            </div>
          </div>
          {f.repetir && f.nova !== f.repetir && (
            <div className="text-[11px] text-[#ff4d8d]">As senhas novas não conferem.</div>
          )}
          {erro && <div className="text-[12px] text-[#ff4d8d]">{erro}</div>}
          <Botao type="submit" disabled={!valido || enviando} className="px-4 py-2 text-xs">
            <Icon nome="cadeado" tam={13} /> {enviando ? 'Trocando…' : 'Trocar senha'}
          </Botao>
        </form>
      </Painel>
    </Secao>
  );
}

// ── Plano ─────────────────────────────────────────────────────────────────
function PlanoECreditos({ user }) {
  return (
    <Secao rotulo="PLANO" titulo="Assinatura e seiva">
      <Painel className="p-5 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/60">Plano atual</span>
            <Etiqueta cor="#00ff64">{user.plano}</Etiqueta>
          </div>
          <div className="flex items-center gap-2 mt-2 text-sm">
            <Icon nome="seiva" tam={15} className="text-[#00ff64]" />
            <b className="hud-tec text-[#00ff64]">{user.creditos}</b>
            <span className="text-white/45 text-xs">de seiva disponível</span>
          </div>
          <p className="text-[11px] text-white/32 mt-2">
            Quando a IA falha no meio de uma geração, a seiva é estornada automaticamente.
          </p>
        </div>
        <Link to="/planos" className="hud-botao px-5 py-2.5 text-sm inline-flex items-center gap-2">
          Ver planos <Icon nome="setaDireita" tam={14} />
        </Link>
      </Painel>
    </Secao>
  );
}

// ── Gamificação ───────────────────────────────────────────────────────────
function Gamificacao({ user }) {
  const xp = user.gamification?.xp || 0;
  const nivel = user.nivel || {};
  const faltam = nivel.proximoNivelXp ? nivel.proximoNivelXp - xp : null;
  const pct = nivel.proximoNivelXp ? (xp / nivel.proximoNivelXp) * 100 : 100;

  return (
    <Secao rotulo="PROGRESSO" titulo="Sua jornada">
      <Painel className="p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-sm">
            <b className="hud-tec text-[#00e5ff]">NV {nivel.nivel}</b>
            <span className="text-white/55"> · {nivel.nome}</span>
          </div>
          <div className="hud-tec text-[11px] text-white/40">
            {xp} XP {faltam > 0 ? `· faltam ${faltam} para o próximo` : ''}
          </div>
        </div>
        <Barra valor={pct} cor="#00e5ff" />
        <div className="flex flex-wrap gap-2 pt-1">
          <Etiqueta cor="#ffc531">
            <Icon nome="trofeu" tam={10} />{user.gamification?.conquistas?.length || 0} conquistas
          </Etiqueta>
          <Etiqueta cor="#ff9f43">
            <Icon nome="chama" tam={10} />{user.gamification?.streak?.dias || 0} dias seguidos
          </Etiqueta>
        </div>
      </Painel>
    </Secao>
  );
}

// ── LGPD ──────────────────────────────────────────────────────────────────
function DadosEPrivacidade({ user, onExcluiu }) {
  const [baixando, setBaixando] = useState(false);
  const [abrirExclusao, setAbrirExclusao] = useState(false);
  const [senha, setSenha] = useState('');
  const [removerPublicados, setRemoverPublicados] = useState(false);
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  const exportar = async () => {
    setBaixando(true);
    try { await baixarMeusDados(); } catch (e) { setErro(e.message); }
    finally { setBaixando(false); }
  };

  const excluir = async () => {
    setErro(null); setExcluindo(true);
    try { await api.excluirConta({ senha, removerPublicados }); onExcluiu(); }
    catch (e) { setErro(e.message); setExcluindo(false); }
  };

  return (
    <Secao rotulo="DADOS E PRIVACIDADE" titulo="Seus direitos"
      descricao="Garantidos pela LGPD, artigo 18. Ficam aqui, na sua mão, sem passar por suporte.">
      <div className="space-y-3">
        <Painel className="p-5 flex items-center justify-between flex-wrap gap-4">
          <div className="min-w-0">
            <div className="font-heading font-bold text-sm">Exportar tudo o que temos sobre você</div>
            <p className="text-[12px] text-white/50 mt-1 max-w-lg">
              Um arquivo JSON com conta, projetos, planos gerados, cálculos de carbono, pagamentos e
              conversas com os agentes. Sem hash de senha e sem token de sessão: isso é segredo do
              sistema, não dado seu.
            </p>
          </div>
          <Botao variante="vazio" onClick={exportar} disabled={baixando} className="px-4 py-2.5 text-xs shrink-0">
            <Icon nome="download" tam={14} /> {baixando ? 'Gerando…' : 'Baixar meus dados'}
          </Botao>
        </Painel>

        <Painel className="p-5" cor="#ff4d8d">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="min-w-0">
              <div className="font-heading font-bold text-sm text-[#ff4d8d]">Excluir minha conta</div>
              <p className="text-[12px] text-white/50 mt-1 max-w-lg">
                Nome, e-mail e senha são apagados. Projetos privados vão junto. Um projeto que você
                publicou na vitrine permanece por padrão, mas sem qualquer vínculo com você. Não há volta.
              </p>
            </div>
            {!abrirExclusao && (
              <button onClick={() => setAbrirExclusao(true)}
                className="hud-botao-vazio px-4 py-2.5 text-xs shrink-0 inline-flex items-center gap-2"
                style={{ color: '#ff4d8d', boxShadow: 'inset 0 0 0 1px #ff4d8d55' }}>
                <Icon nome="lixeira" tam={14} /> Excluir conta
              </button>
            )}
          </div>

          {abrirExclusao && (
            <div className="mt-4 pt-4 border-t border-[#ff4d8d33] space-y-3">
              <label className="flex items-start gap-2.5 text-[12px] text-white/60 cursor-pointer">
                <input type="checkbox" checked={removerPublicados} className="accent-[#ff4d8d] mt-0.5"
                  onChange={e => setRemoverPublicados(e.target.checked)} />
                Remover também os projetos que publiquei na vitrine da comunidade.
              </label>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Rotulo cor="#ff4d8d" className="mb-1.5">CONFIRME SUA SENHA</Rotulo>
                  <Campo type="password" className="w-full px-3 py-2.5 text-sm" placeholder="••••••••"
                    value={senha} onChange={e => setSenha(e.target.value)} />
                </div>
                <div>
                  <Rotulo cor="#ff4d8d" className="mb-1.5">DIGITE EXCLUIR</Rotulo>
                  <Campo className="w-full px-3 py-2.5 text-sm" placeholder="EXCLUIR"
                    value={confirmacao} onChange={e => setConfirmacao(e.target.value.toUpperCase())} />
                </div>
              </div>
              {erro && <div className="text-[12px] text-[#ff4d8d]">{erro}</div>}
              <div className="flex gap-2 flex-wrap">
                <button onClick={excluir} disabled={!senha || confirmacao !== 'EXCLUIR' || excluindo}
                  className="hud-botao px-4 py-2.5 text-xs disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg,#ff4d8d,#ff8f5e)' }}>
                  {excluindo ? 'Excluindo…' : 'Excluir minha conta definitivamente'}
                </button>
                <Botao variante="vazio" onClick={() => setAbrirExclusao(false)} className="px-4 py-2.5 text-xs">
                  Cancelar
                </Botao>
              </div>
            </div>
          )}
        </Painel>

        <div className="flex gap-4 text-[11px] text-white/35 px-1 flex-wrap">
          <Link to="/termos" className="hover:text-white/70 transition-colors">Termos de uso</Link>
          <Link to="/privacidade" className="hover:text-white/70 transition-colors">Política de privacidade</Link>
          {user.termosAceitos && (
            <span className="ml-auto">
              Termos {user.termosAceitos.versao} aceitos em {new Date(user.termosAceitos.em).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
      </div>
    </Secao>
  );
}
