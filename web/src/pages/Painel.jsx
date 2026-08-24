import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getPainelToken, setPainelToken } from '../lib/api.js';
import { useUser } from '../App.jsx';
import BrandLockup from '../components/BrandLockup.jsx';
import Icon from '../components/Icon.jsx';
import { Painel as Bloco, Rotulo, Etiqueta, Botao, Campo, Abas, Estatistica } from '../components/hud/index.jsx';
import Sessoes from '../components/conta/Sessoes.jsx';
import Carga from '../components/Carga.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// PAINEL DE ADMINISTRAÇÃO: área com porta própria.
//
// Estar logado na plataforma não basta: aqui o administrador confirma a senha
// e abre uma janela de 30 minutos. Expirou, pede de novo. Toda ação escrita
// nesta tela vai para a trilha de auditoria com autor, horário e IP.
//
// Dentro do painel, cada seção só existe se o papel tiver a capacidade
// correspondente: o editor entra e vê menos que o administrador.
// ═══════════════════════════════════════════════════════════════════════════

const ABAS = [
  { id: 'usuarios', label: 'Usuários', icone: 'usuarios', cap: 'usuarios.ler' },
  // Sem capacidade exigida: esta aba fala da SUA conta, e quem já entrou aqui
  // é dono dela. Pedir permissão para ver onde a própria credencial está
  // aberta seria pedir permissão para se proteger.
  { id: 'acesso', label: 'Acesso', icone: 'escudo', cap: null },
  { id: 'vitrine', label: 'Vitrine', icone: 'vitrine', cap: 'comunidade.curar' },
  { id: 'papeis', label: 'Níveis de acesso', icone: 'chave', cap: 'usuarios.ler' },
  { id: 'auditoria', label: 'Auditoria', icone: 'lista', cap: 'sistema.configurar' },
];

export default function Painel() {
  const { user } = useUser();
  const [estado, setEstado] = useState(null);       // { elevado, podeEntrar }
  const [contexto, setContexto] = useState(null);   // papel + capacidades
  const [aba, setAba] = useState('usuarios');
  const [erro, setErro] = useState(null);

  const sincronizar = useCallback(async () => {
    try {
      const e = await api.painelEstado();
      // Contexto primeiro, estado depois: publicar "elevado" antes de ter o
      // contexto faria a tela renderizar num estado que não existe.
      const c = e.elevado ? await api.painelContexto() : null;
      setContexto(c);
      setEstado(e);
    } catch (err) { setErro(err.message); }
  }, []);

  useEffect(() => { sincronizar(); }, [sincronizar]);

  // Expiração visível: quando a janela fecha, a tela volta sozinha ao cadeado
  useEffect(() => {
    if (!contexto?.expiraEm) return;
    const ms = new Date(contexto.expiraEm).getTime() - Date.now();
    if (ms <= 0) { setPainelToken(null); sincronizar(); return; }
    const t = setTimeout(() => { setPainelToken(null); sincronizar(); }, ms);
    return () => clearTimeout(t);
  }, [contexto, sincronizar]);

  if (!estado) return <div className="text-white/40 text-sm p-8">Verificando acesso…</div>;

  if (!estado.podeEntrar) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-3">
        <Icon nome="cadeado" tam={40} className="text-[#ff4d8d] mx-auto" />
        <h1 className="font-heading text-xl font-bold">Área restrita</h1>
        <p className="text-white/50 text-sm">
          Seu nível de acesso não inclui o painel de administração. Fale com um administrador se precisar entrar.
        </p>
        <Link to="/" className="hud-botao-vazio px-4 py-2 inline-flex items-center gap-2 mt-2 text-sm">
          <Icon nome="setaDireita" tam={14} className="rotate-180" /> voltar para a plataforma
        </Link>
      </div>
    );
  }

  if (!estado.elevado || !contexto) return <Cadeado user={user} onEntrou={sincronizar} />;

  const pode = (cap) => contexto?.capacidades?.includes(cap);
  const abasVisiveis = ABAS.filter(a => !a.cap || pode(a.cap));
  const abaAtual = abasVisiveis.some(a => a.id === aba) ? aba : abasVisiveis[0]?.id;

  const sair = async () => { await api.painelSair(); sincronizar(); };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-heading text-2xl font-bold">Painel de <span className="zd-gradient-text">Administração</span></h1>
            <Etiqueta cor={contexto.papel === 'admin' ? '#00ff64' : '#00e5ff'}>{contexto.papel}</Etiqueta>
          </div>
          <p className="text-white/50 text-sm mt-1">
            Sessão aberta como <b className="text-white/75">{contexto.usuario.nome}</b> · expira {new Date(contexto.expiraEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <Botao variante="vazio" onClick={sair} className="px-4 py-2 text-xs">
          <Icon nome="cadeado" tam={13} /> Fechar painel
        </Botao>
      </header>

      {erro && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{erro}</div>}

      <Abas
        itens={abasVisiveis.map(a => ({ id: a.id, label: a.label, icone: <Icon nome={a.icone} tam={13} /> }))}
        ativo={abaAtual}
        onMudar={setAba}
        className="border-b border-[#00e5ff1f] pb-3"
      />

      {abaAtual === 'acesso' && <Acesso user={user} />}
      {abaAtual === 'usuarios' && <Usuarios contexto={contexto} />}
      {abaAtual === 'vitrine' && <Vitrine />}
      {abaAtual === 'papeis' && <Papeis contexto={contexto} />}
      {abaAtual === 'auditoria' && <Auditoria />}
    </div>
  );
}

// ── Acesso: onde esta credencial está aberta ──────────────────────────────
// A conta que abre este painel enxerga o ecossistema inteiro. Uma sessão dela
// esquecida num computador de escritório vale mais que qualquer outra da
// plataforma, e por isso o controle mora aqui também, e não só em
// Configurações: é aqui que se lembra do risco.
function Acesso({ user }) {
  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <Rotulo cor="#ffc531">SUA CREDENCIAL</Rotulo>
        <h2 className="font-heading text-lg font-bold mt-1.5">Onde este login está aberto</h2>
        <p className="text-white/45 text-[13px] mt-1">
          Cada navegador em que <b className="text-white/70">{user.email}</b> entrou mantém uma sessão
          própria. Desconectar derruba o acesso daquele aparelho na hora.
        </p>
      </div>

      <Sessoes />

      <Bloco cor="#ffc531" tamanho="p" className="p-3.5">
        <div className="flex gap-2.5">
          <Icon nome="alerta" tam={14} className="text-[#ffc531] shrink-0 mt-0.5" />
          <p className="text-[12px] text-white/70 leading-relaxed">
            Se você suspeita que a senha vazou, desconectar não basta: quem a tem entra de novo.
            Nesse caso, <Link to="/configuracoes" className="text-[color:var(--zd-acento)] hover:underline">troque
            a senha</Link>, que encerra todas as sessões junto.
          </p>
        </div>
      </Bloco>
    </div>
  );
}

// ── Porta: reconfirmação de senha ──────────────────────────────────────────
function Cadeado({ user, onEntrou }) {
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const entrar = async (e) => {
    e.preventDefault();
    setErro(null); setEnviando(true);
    try { await api.painelEntrar(senha); setSenha(''); await onEntrou(); }
    catch (err) { setErro(err.message); }
    finally { setEnviando(false); }
  };

  return (
    <div className="max-w-sm mx-auto py-16">
      <Bloco aceso quatroCantos className="p-7">
        <div className="text-center mb-6">
          <BrandLockup symbolSize={40} wordmarkHeight={30} className="justify-center mb-5" />
          <Icon nome="escudo" tam={34} className="text-[#00ff64] mx-auto mb-2" />
          <h1 className="font-heading text-lg font-bold">Painel de Administração</h1>
          <p className="text-white/50 text-[13px] mt-1.5 leading-relaxed">
            Confirme sua senha para abrir uma sessão administrativa de 30 minutos.
          </p>
        </div>

        <div className="hud-corte bg-white/[.04] px-3 py-2 mb-4 text-[11px] text-white/55" style={{ '--c': '6px' }}>
          Entrando como <b className="text-white/80">{user?.email}</b>
        </div>

        {erro && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mb-4">{erro}</div>}

        <form onSubmit={entrar} className="space-y-3">
          <div>
            <label className="text-xs text-white/60 block mb-1.5">Sua senha</label>
            <Campo type="password" required autoFocus autoComplete="current-password"
              className="w-full px-3 py-2.5 text-sm" placeholder="••••••••"
              value={senha} onChange={e => setSenha(e.target.value)} />
          </div>
          <Botao type="submit" disabled={enviando || !senha} className="w-full py-3 text-sm">
            <Icon nome="cadeadoAberto" tam={15} /> {enviando ? 'Verificando…' : 'Abrir painel'}
          </Botao>
        </form>

        <ul className="mt-5 pt-4 border-t border-white/8 space-y-1.5">
          {[
            'A sessão expira sozinha em 30 minutos',
            'Cinco senhas erradas bloqueiam por 10 minutos',
            'Toda ação fica registrada na trilha de auditoria',
          ].map(t => (
            <li key={t} className="text-[10px] text-white/35 flex gap-1.5"><span className="zd-green">·</span>{t}</li>
          ))}
        </ul>
      </Bloco>
      <div className="text-center mt-4">
        <Link to="/" className="text-[11px] text-white/40 hover:text-white/70 transition-colors">← voltar para a plataforma</Link>
      </div>
    </div>
  );
}

// ── Usuários ───────────────────────────────────────────────────────────────
const COR_PAPEL = { admin: '#00ff64', editor: '#00c8ff', fundador: '#ffd700' };

function Usuarios({ contexto }) {
  const [dados, setDados] = useState(null);
  const [novo, setNovo] = useState(null);   // formulário aberto
  const [erro, setErro] = useState(null);
  const podeGerenciar = contexto.capacidades.includes('usuarios.gerenciar');

  const carregar = useCallback(() => api.painelUsuarios().then(setDados).catch(e => setErro(e.message)), []);
  useEffect(() => { carregar(); }, [carregar]);

  const agir = async (fn) => {
    setErro(null);
    try { await fn(); await carregar(); } catch (e) { setErro(e.message); }
  };

  if (!dados) return <Carga erro={erro} oQue="os usuários" aoTentar={() => { setErro(null); carregar(); }} />;

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {[
            ['total', 'no total', '#00e5ff'], ['admins', 'administradores', '#00ff64'],
            ['editores', 'editores', '#00c8ff'], ['fundadores', 'fundadores', '#ffc531'],
            ['inativos', 'desativados', '#ff4d8d'],
          ].map(([k, l, c]) => (
            <Estatistica key={k} valor={dados.resumo[k]} rotulo={l} cor={c} />
          ))}
        </div>
        {podeGerenciar && (
          <Botao onClick={() => setNovo(novo ? null : { papel: 'editor', nome: '', email: '', senha: '' })}
            className="px-4 py-2.5 text-sm">
            <Icon nome={novo ? 'fechar' : 'mais'} tam={14} />{novo ? 'Cancelar' : 'Adicionar usuário'}
          </Botao>
        )}
      </div>

      {erro && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{erro}</div>}

      {novo && (
        <FormNovoUsuario
          valor={novo} onMudar={setNovo} papeis={contexto.papeis}
          atribuiveis={contexto.papeisAtribuiveis}
          onCriar={() => agir(async () => { await api.painelCriarUsuario(novo); setNovo(null); })}
        />
      )}

      <div className="space-y-2">
        {dados.usuarios.map(u => (
          <LinhaUsuario key={u.id} u={u} podeGerenciar={podeGerenciar}
            euId={contexto.usuario.id} atribuiveis={contexto.papeisAtribuiveis} agir={agir} />
        ))}
      </div>
    </div>
  );
}

function FormNovoUsuario({ valor, onMudar, papeis, atribuiveis, onCriar }) {
  const set = (k) => (e) => onMudar({ ...valor, [k]: e.target.value });
  const escolhido = papeis.find(p => p.id === valor.papel);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onCriar(); }} className="hud-painel hud-aceso hud-4 p-5 space-y-4">
      <div className="font-heading font-bold text-sm">Novo acesso à plataforma</div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-white/60 block mb-1.5">Nome</label>
          <Campo className="w-full px-3 py-2.5 text-sm" placeholder="Nome da pessoa"
            value={valor.nome} onChange={set('nome')} />
        </div>
        <div>
          <label className="text-xs text-white/60 block mb-1.5">E-mail *</label>
          <Campo type="email" required className="w-full px-3 py-2.5 text-sm" placeholder="pessoa@empresa.com"
            value={valor.email} onChange={set('email')} />
        </div>
        <div>
          <label className="text-xs text-white/60 block mb-1.5">Senha provisória *</label>
          <Campo type="text" required minLength={8} className="w-full px-3 py-2.5 text-sm" placeholder="mínimo 8 caracteres"
            value={valor.senha} onChange={set('senha')} />
        </div>
      </div>

      <div>
        <label className="text-xs text-white/60 block mb-2">Nível de acesso</label>
        <div className="grid sm:grid-cols-2 gap-3">
          {papeis.filter(p => atribuiveis.includes(p.id)).map(p => (
            <button type="button" key={p.id} onClick={() => onMudar({ ...valor, papel: p.id })}
              className="hud-painel hud-p text-left p-3.5 transition-all"
              style={{ '--cor': valor.papel === p.id ? '#00ff64' : 'rgba(255,255,255,.14)' }}>
              <div className="text-sm font-semibold">{p.emoji} {p.nome}</div>
              <div className="text-[11px] text-white/45 mt-1 leading-snug">{p.resumo}</div>
            </button>
          ))}
        </div>
      </div>

      {escolhido && (
        <div className="hud-painel hud-p p-3.5 grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] font-bold zd-green uppercase tracking-wider mb-1.5">Vai poder</div>
            <ul className="space-y-1">
              {escolhido.permite.map(c => (
                <li key={c.id} className="text-[11px] text-white/60 flex gap-1.5 leading-snug">
                  <span className="zd-green shrink-0">✓</span>{c.descricao}
                </li>
              ))}
            </ul>
          </div>
          {escolhido.naoPermite.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-white/35 uppercase tracking-wider mb-1.5">Não vai poder</div>
              <ul className="space-y-1">
                {escolhido.naoPermite.map(c => (
                  <li key={c.id} className="text-[11px] text-white/35 flex gap-1.5 leading-snug">
                    <span className="shrink-0">✕</span>{c.descricao}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <Botao type="submit" className="px-5 py-2.5 text-sm"><Icon nome="check" tam={14} />Criar acesso</Botao>
      <p className="text-[10px] text-white/32">
        A pessoa entra com este e-mail e a senha provisória. Recomende que ela troque a senha no primeiro acesso.
      </p>
    </form>
  );
}

function LinhaUsuario({ u, podeGerenciar, euId, atribuiveis, agir }) {
  const [aberto, setAberto] = useState(false);
  const [novaSenha, setNovaSenha] = useState('');
  const cor = COR_PAPEL[u.papel] || '#ffffff55';

  return (
    <Bloco tamanho="p" cor={COR_PAPEL[u.papel] || '#00e5ff'} className={`p-3.5 ${u.ativo ? '' : 'opacity-55'}`}>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-9 h-9 hud-corte shrink-0 flex items-center justify-center font-bold text-sm"
          style={{ '--c': '6px', background: `${cor}18`, boxShadow: `inset 0 0 0 1px ${cor}38`, color: cor }}>
          {u.nome.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{u.nome}</span>
            <Etiqueta cor={cor}>{u.papel}</Etiqueta>
            {u.id === euId && <Etiqueta cor="#00c8ff">você</Etiqueta>}
            {!u.ativo && <Etiqueta cor="#ff4d8d">desativado</Etiqueta>}
          </div>
          <div className="text-[11px] text-white/45 mt-0.5 truncate">
            {u.email} · {u.projetos} projeto(s) · {u.publicados} publicado(s)
            {u.ultimoAcesso && ` · visto ${new Date(u.ultimoAcesso).toLocaleDateString('pt-BR')}`}
          </div>
        </div>
        {podeGerenciar && (
          <button onClick={() => setAberto(v => !v)} className="text-[11px] zd-green hover:underline shrink-0">
            {aberto ? 'fechar ▴' : 'gerenciar ▾'}
          </button>
        )}
      </div>

      {aberto && podeGerenciar && (
        <div className="mt-3 pt-3 border-t border-white/8 flex flex-wrap items-end gap-3">
          <div>
            <div className="text-[10px] text-white/45 mb-1.5">Nível de acesso</div>
            <div className="flex gap-1.5">
              {[...atribuiveis, 'fundador'].map(p => (
                <button key={p} onClick={() => agir(() => api.painelAtualizarUsuario(u.id, { papel: p }))}
                  className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold border transition-all ${
                    u.papel === p ? 'border-[#00ff6455] bg-[#00ff6414] text-[#00ff64]' : 'border-white/12 text-white/50 hover:text-white/85'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-white/45 mb-1.5">Redefinir senha</div>
            <div className="flex gap-1.5">
              <Campo type="text" placeholder="nova senha (8+)" value={novaSenha} onChange={e => setNovaSenha(e.target.value)}
                className="px-2.5 py-1.5 text-[11px] w-40" />
              <button disabled={novaSenha.length < 8}
                onClick={() => agir(async () => { await api.painelAtualizarUsuario(u.id, { senha: novaSenha }); setNovaSenha(''); })}
                className="rounded-lg px-2.5 py-1.5 text-[11px] border border-white/12 text-white/60 hover:text-white disabled:opacity-40">
                aplicar
              </button>
            </div>
          </div>

          <button onClick={() => agir(() => api.painelAtualizarUsuario(u.id, { ativo: !u.ativo }))}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold border transition-colors ml-auto ${
              u.ativo ? 'border-red-500/30 text-red-400/85 hover:bg-red-500/10' : 'border-[#00ff6444] text-[#00ff64] hover:bg-[#00ff640f]'}`}>
            {u.ativo ? 'Desativar acesso' : 'Reativar acesso'}
          </button>
        </div>
      )}
    </Bloco>
  );
}

// ── Níveis de acesso (documentação viva da matriz de permissões) ───────────
function Papeis({ contexto }) {
  return (
    <div className="space-y-3">
      <p className="text-white/50 text-sm max-w-2xl">
        Cada nível é uma lista de capacidades. O sistema nunca pergunta "essa pessoa é admin?"–
        pergunta "essa pessoa pode fazer isto?". É o que mantém o corte previsível.
      </p>
      <div className="grid md:grid-cols-3 gap-3">
        {contexto.papeis.map(p => (
          <Bloco key={p.id} cor={p.cor} quatroCantos className="p-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">{p.emoji}</span>
              <div>
                <div className="font-heading font-bold text-sm">{p.nome}</div>
                <div className="text-[10px]" style={{ color: p.cor }}>{p.capacidades.length} capacidades</div>
              </div>
            </div>
            <p className="text-[11px] text-white/50 mt-2 leading-relaxed">{p.resumo}</p>
            <ul className="mt-3 pt-3 border-t border-white/8 space-y-1">
              {p.permite.map(c => (
                <li key={c.id} className="text-[11px] text-white/60 flex gap-1.5 leading-snug">
                  <span className="shrink-0" style={{ color: p.cor }}>✓</span>{c.descricao}
                </li>
              ))}
              {p.naoPermite.map(c => (
                <li key={c.id} className="text-[11px] text-white/28 flex gap-1.5 leading-snug">
                  <span className="shrink-0">✕</span>{c.descricao}
                </li>
              ))}
            </ul>
          </Bloco>
        ))}
      </div>
    </div>
  );
}

// ── Curadoria da vitrine ───────────────────────────────────────────────────
function Vitrine() {
  const [itens, setItens] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => { api.painelVitrine().then(setItens).catch(e => setErro(e.message)); }, []);
  const agir = async (fn) => { setErro(null); try { setItens(await fn()); } catch (e) { setErro(e.message); } };
  const buscar = () => { setErro(null); api.painelVitrine().then(setItens).catch(e => setErro(e.message)); };

  if (!itens) return <Carga erro={erro} oQue="a vitrine" aoTentar={buscar} />;

  return (
    <div className="space-y-3">
      {erro && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{erro}</div>}
      {itens.length === 0 && (
        <Bloco className="p-8 text-center text-white/45 text-sm">
          Nenhum projeto publicado na vitrine ainda.
        </Bloco>
      )}
      {itens.map(p => (
        <Bloco key={p.id} tamanho="p" className={`p-3.5 flex items-center gap-3 flex-wrap ${p.oculto ? 'opacity-55' : ''}`}>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{p.nome}</span>
              {p.destaque && <Etiqueta cor="#ffc531"><Icon nome="trofeu" tam={10} />destaque</Etiqueta>}
              {p.oculto && <Etiqueta cor="#ffffff66">oculto</Etiqueta>}
            </div>
            <div className="text-[11px] text-white/45 mt-0.5 line-clamp-1">{p.resumo}</div>
            <div className="text-[10px] text-white/30 mt-1">
              por {p.autor} · {p.classificacao} · {new Date(p.publicadoEm).toLocaleDateString('pt-BR')}
            </div>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <button onClick={() => agir(() => api.painelDestacar(p.id, !p.destaque))}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold border transition-colors ${
                p.destaque ? 'border-[#ffd70055] text-[#ffd700] bg-[#ffd7000f]' : 'border-white/12 text-white/55 hover:text-white'}`}>
              {p.destaque ? '★ destacado' : '☆ destacar'}
            </button>
            <button onClick={() => agir(() => api.painelOcultar(p.id, !p.oculto))}
              className="rounded-lg px-3 py-1.5 text-[11px] font-semibold border border-white/12 text-white/55 hover:text-white transition-colors">
              {p.oculto ? 'reexibir' : 'ocultar'}
            </button>
          </div>
        </Bloco>
      ))}
    </div>
  );
}

// ── Trilha de auditoria ────────────────────────────────────────────────────
const ICONE_ACAO = {
  'painel.entrada': '🔓', 'painel.saida': '🔒', 'painel.senha_incorreta': '⚠️',
  'painel.acesso_negado': '⛔', 'usuario.criado': '➕', 'usuario.alterado': '✏️',
  'usuario.desativado': '🚫', 'vitrine.destaque': '★', 'vitrine.ocultacao': '👁️',
};

// O teto que o servidor guarda na trilha (ver sessaoPainel.js). Pedir menos
// que isto e anunciar o número cheio foi o defeito que estava aqui.
const LIMITE_AUDITORIA = 500;

function Auditoria() {
  const [registros, setRegistros] = useState(null);
  const [erro, setErro] = useState(null);
  // A tela dizia "as 500 mais recentes" e pedia 200: quem fosse conferir uma
  // ação de trezentas atrás não a encontrava e concluía que ela não existiu.
  // 500 é o teto que o servidor guarda, e é o que a trilha pede agora.
  const buscar = () => {
    setErro(null);
    api.painelAuditoria(LIMITE_AUDITORIA).then(setRegistros).catch(e => setErro(e.message));
  };
  useEffect(() => { buscar(); }, []);

  if (!registros) return <Carga erro={erro} oQue="a trilha" aoTentar={buscar} />;

  return (
    <div className="space-y-2">
      <p className="text-white/50 text-sm">
        {registros.length === LIMITE_AUDITORIA
          ? `As ${LIMITE_AUDITORIA} ações administrativas mais recentes`
          : `${registros.length} ${registros.length === 1 ? 'ação administrativa registrada' : 'ações administrativas registradas'}`}
        , com autor, horário e origem. Somente leitura.
      </p>
      {registros.length === 0 && <Bloco className="p-8 text-center text-white/45 text-sm">Nada registrado ainda.</Bloco>}
      {registros.map(r => (
        <Bloco key={r.id} tamanho="p" className="px-3.5 py-2.5 flex items-start gap-3">
          <span className="text-sm shrink-0 w-5 text-center">{ICONE_ACAO[r.acao] || '·'}</span>
          <div className="min-w-0 flex-1">
            <div className="text-[12px]">
              <b className="text-white/85">{r.atorNome}</b>
              <span className="text-white/40"> · {r.acao}</span>
            </div>
            {r.detalhe && <div className="text-[11px] text-white/45 mt-0.5">{r.detalhe}</div>}
          </div>
          <div className="text-[10px] text-white/30 shrink-0 text-right">
            {new Date(r.em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            {r.ip && <div className="text-white/20">{r.ip}</div>}
          </div>
        </Bloco>
      ))}
    </div>
  );
}
