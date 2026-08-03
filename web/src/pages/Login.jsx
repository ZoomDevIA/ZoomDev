import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, setToken } from '../lib/api.js';
import { useUser } from '../App.jsx';
import BrandLockup from '../components/BrandLockup.jsx';
import Icon from '../components/Icon.jsx';
import { Botao, Campo, Painel } from '../components/hud/index.jsx';

export default function Login() {
  const { refreshUser } = useUser();
  const [params] = useSearchParams();
  // Quem veio da caixa de ideação da home chega em "criar conta" e com a
  // ideia guardada: depois de entrar, a Home retoma o rascunho sozinha.
  const veioDaIdeacao = params.get('proximo') === 'construir';
  const [tab, setTab] = useState(
    params.get('modo') === 'cadastro' || veioDaIdeacao ? 'criar' : 'entrar');
  const [form, setForm] = useState({ email: '', password: '', nome: '' });
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState(null);
  // Recuperação de senha: um passo à parte, dentro da mesma caixa
  const [recuperando, setRecuperando] = useState(false);
  const [recuperacao, setRecuperacao] = useState(null);

  const emBreve = (nome) => {
    setAviso(`Login com ${nome} estará disponível em breve.`);
    setTimeout(() => setAviso(null), 3500);
  };

  const pedirRecuperacao = async (e) => {
    e.preventDefault();
    setErro(null); setEnviando(true);
    try {
      // A resposta é idêntica exista ou não a conta: a tela não pode revelar
      // quais e-mails estão cadastrados.
      setRecuperacao(await api.pedirRecuperacao(form.email));
    } catch (err) { setErro(err.message); }
    finally { setEnviando(false); }
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const enviar = async (e) => {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const r = tab === 'entrar' ? await api.login(form) : await api.register(form);
      setToken(r.token);
      await refreshUser();
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen zd-bg flex items-center justify-center p-6 relative"
      style={{ backgroundImage: 'url(/assets/site/login-hero.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(3,13,7,.82), rgba(3,13,7,.9))' }} />
      <div className="grid lg:grid-cols-2 gap-12 max-w-5xl w-full items-center relative">
        <div className="hidden lg:block">
          <BrandLockup symbolSize={56} wordmarkHeight={46} className="mb-8" />
          <h1 className="font-heading text-4xl font-bold leading-tight">
            Construa o futuro. Com <span className="zd-green">IA</span>. Com propósito.
          </h1>
          <p className="text-white/55 mt-4 max-w-md">
            A plataforma completa para startups, empresas e inovadores que querem transformar ideias em impacto real.
          </p>
          <div className="grid grid-cols-3 gap-3 mt-8">
            {[
              ['🧠', 'IA Avançada', 'Agentes inteligentes e automações'],
              ['🛡️', 'Segurança Total', 'Seus dados protegidos com criptografia'],
              ['☁️', 'Na Nuvem', 'Acesse de qualquer lugar com alta performance'],
            ].map(([ic, t, d]) => (
              <div key={t} className="zd-card rounded-xl p-4">
                <div className="text-xl">{ic}</div>
                <div className="font-semibold text-sm mt-2">{t}</div>
                <div className="text-xs text-white/45 mt-1">{d}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="zd-card-glow rounded-2xl p-6 md:p-8 w-full max-w-md mx-auto">
          {veioDaIdeacao && (
            <div className="rounded-xl border border-[#00ff6433] bg-[#00ff640d] px-3.5 py-2.5 mb-5">
              <div className="text-xs zd-green font-semibold">✦ Sua ideia está guardada</div>
              <p className="text-[11px] text-white/55 mt-0.5 leading-snug">
                Crie a conta e voltamos exatamente de onde você parou, sem digitar de novo.
              </p>
            </div>
          )}
          {recuperando ? (
            <RecuperarSenha
              email={form.email}
              onEmail={(v) => setForm(f => ({ ...f, email: v }))}
              resultado={recuperacao}
              erro={erro}
              enviando={enviando}
              onEnviar={pedirRecuperacao}
              onVoltar={() => { setRecuperando(false); setRecuperacao(null); setErro(null); }}
            />
          ) : (
          <>
          <div className="flex rounded-full bg-white/5 p-1 mb-6">
            {['entrar', 'criar'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${tab === t ? 'zd-gradient-btn' : 'text-white/60'}`}>
                {t === 'entrar' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>
          <h2 className="font-heading text-xl font-bold mb-1">
            {tab === 'entrar' ? 'Bem-vindo(a) de volta! 👋' : 'Crie sua conta 🚀'}
          </h2>
          <p className="text-sm text-white/50 mb-5">
            {tab === 'entrar' ? 'Entre para continuar sua jornada de inovação.' : 'Comece sua jornada de inovação na Amazônia.'}
          </p>
          {erro && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mb-4">{erro}</div>}
          <form onSubmit={enviar} className="space-y-4">
            {tab === 'criar' && (
              <div>
                <label className="text-xs text-white/60 block mb-1.5">Nome</label>
                <input className="zd-input w-full rounded-lg px-3 py-2.5 text-sm" placeholder="Seu nome" value={form.nome} onChange={set('nome')} />
              </div>
            )}
            <div>
              <label className="text-xs text-white/60 block mb-1.5">E-mail</label>
              <input type="email" required className="zd-input w-full rounded-lg px-3 py-2.5 text-sm" placeholder="seu@email.com" value={form.email} onChange={set('email')} />
            </div>
            <div>
              <label className="text-xs text-white/60 block mb-1.5">Senha</label>
              <input type="password" required minLength={8} className="zd-input w-full rounded-lg px-3 py-2.5 text-sm" placeholder="••••••••" value={form.password} onChange={set('password')} />
            </div>
            {tab === 'entrar' && (
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-white/55 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-[#00ff64]" /> Lembrar de mim
                </label>
                <button type="button" onClick={() => { setRecuperando(true); setErro(null); }}
                  className="zd-green hover:underline">Esqueci minha senha</button>
              </div>
            )}
            <button type="submit" disabled={enviando} className="zd-gradient-btn w-full rounded-lg py-3 text-sm">
              {enviando ? 'Aguarde…' : tab === 'entrar' ? 'Entrar na plataforma →' : 'Criar conta →'}
            </button>
            {tab === 'criar' && (
              <p className="text-[10px] text-white/32 leading-relaxed">
                Ao criar a conta você aceita os{' '}
                <Link to="/termos" className="zd-green hover:underline">termos de uso</Link> e a{' '}
                <Link to="/privacidade" className="zd-green hover:underline">política de privacidade</Link>.
                A versão aceita fica registrada com data na sua conta.
              </p>
            )}
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] text-white/40 uppercase tracking-wider">ou continue com</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
          {aviso && <div className="zd-notification rounded-lg px-3 py-2 text-xs mb-3">{aviso}</div>}
          <div className="grid grid-cols-3 gap-2">
            {[['Google', 'G'], ['GitHub', '⌥'], ['Microsoft', '⊞'], ['Apple', ''], ['Biometria', '👆']].map(([nome, ic]) => (
              <button key={nome} type="button" onClick={() => emBreve(nome)}
                className="rounded-lg border border-white/12 bg-white/[.04] hover:bg-white/[.08] transition-colors py-2 text-xs text-white/70 flex items-center justify-center gap-1.5">
                <span>{ic}</span> {nome}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-white/35 mt-5 flex items-start gap-1.5">
            <Icon nome="cadeado" tam={12} className="mt-0.5 shrink-0" />
            Sua senha é guardada como hash scrypt com sal único. Nem o administrador consegue lê-la.
          </p>
          </>
          )}
          <div className="text-center mt-4 pt-4 border-t border-white/8 flex justify-center gap-4 flex-wrap">
            <Link to="/" className="text-[11px] text-white/40 hover:text-white/70 transition-colors">
              voltar para a home
            </Link>
            <Link to="/termos" className="text-[11px] text-white/30 hover:text-white/60 transition-colors">termos</Link>
            <Link to="/privacidade" className="text-[11px] text-white/30 hover:text-white/60 transition-colors">privacidade</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Recuperação de senha ──────────────────────────────────────────────────
// A resposta do servidor é a mesma exista ou não a conta. A tela repete essa
// neutralidade no texto: dizer "e-mail não encontrado" entregaria quais
// endereços estão cadastrados a quem estivesse testando.
function RecuperarSenha({ email, onEmail, resultado, erro, enviando, onEnviar, onVoltar }) {
  if (resultado) {
    return (
      <div className="text-center space-y-3">
        <Icon nome="enviar" tam={30} className="text-[#00ff64] mx-auto" />
        <h2 className="font-heading text-lg font-bold">Pedido registrado</h2>
        <p className="text-white/55 text-[13px] leading-relaxed">
          Se existir uma conta com <b className="text-white/80">{email}</b>, o link de redefinição
          chega em instantes. Ele vale por 30 minutos e só pode ser usado uma vez.
        </p>

        {resultado.link && (
          <Painel cor="#ffc531" className="p-3.5 text-left">
            <div className="hud-caps text-[9px] text-[#ffc531] mb-1.5">Ambiente sem provedor de e-mail</div>
            <p className="text-[11px] text-white/50 mb-2">{resultado.aviso}</p>
            <a href={resultado.link} className="text-[11px] text-[#00e5ff] break-all hover:underline">
              {resultado.link}
            </a>
          </Painel>
        )}

        <button onClick={onVoltar} className="text-[12px] text-white/45 hover:text-white/80 transition-colors pt-1">
          voltar para a entrada
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onEnviar} className="space-y-4">
      <div className="text-center mb-1">
        <Icon nome="chave" tam={28} className="text-[#00e5ff] mx-auto mb-2" />
        <h2 className="font-heading text-lg font-bold">Recuperar acesso</h2>
        <p className="text-white/50 text-[13px] mt-1.5">
          Informe o e-mail da conta. Enviamos um link para você definir uma senha nova.
        </p>
      </div>

      {erro && <div className="text-sm text-[#ff4d8d] bg-[#ff4d8d14] px-3 py-2">{erro}</div>}

      <div>
        <label className="text-xs text-white/60 block mb-1.5">E-mail</label>
        <Campo type="email" required autoFocus className="w-full px-3 py-2.5 text-sm"
          placeholder="seu@email.com" value={email} onChange={e => onEmail(e.target.value)} />
      </div>

      <Botao type="submit" disabled={enviando || !email} className="w-full py-3 text-sm">
        <Icon nome="enviar" tam={14} /> {enviando ? 'Enviando…' : 'Enviar link de redefinição'}
      </Botao>

      <button type="button" onClick={onVoltar}
        className="w-full text-[12px] text-white/45 hover:text-white/80 transition-colors">
        voltar para a entrada
      </button>
    </form>
  );
}
