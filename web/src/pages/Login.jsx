import React, { useState } from 'react';
import { api, setToken } from '../lib/api.js';
import { useUser } from '../App.jsx';
import Logo from '../components/Logo.jsx';

export default function Login() {
  const { refreshUser } = useUser();
  const [tab, setTab] = useState('entrar');
  const [form, setForm] = useState({ email: '', password: '', nome: '' });
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

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
    <div className="min-h-screen zd-bg zd-circuit-bg flex items-center justify-center p-6">
      <div className="grid lg:grid-cols-2 gap-12 max-w-5xl w-full items-center">
        <div className="hidden lg:block">
          <Logo className="w-14 h-14 mb-8" />
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
            <button type="submit" disabled={enviando} className="zd-gradient-btn w-full rounded-lg py-3 text-sm">
              {enviando ? 'Aguarde…' : tab === 'entrar' ? 'Entrar na plataforma →' : 'Criar conta →'}
            </button>
          </form>
          <p className="text-[11px] text-white/35 mt-5">🔒 Seus dados estão protegidos com criptografia de ponta a ponta.</p>
        </div>
      </div>
    </div>
  );
}
