import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../App.jsx';

export default function Configuracoes() {
  const { user } = useUser();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="font-heading text-2xl font-bold">⚙️ Configurações</h1>

      <div className="zd-card-glow rounded-2xl p-6">
        <h2 className="font-heading font-bold mb-4">Perfil</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] text-white/55 block mb-1">Nome</label>
            <input className="zd-input w-full rounded-lg px-3 py-2.5 text-sm" defaultValue={user.nome} disabled />
          </div>
          <div>
            <label className="text-[11px] text-white/55 block mb-1">E-mail</label>
            <input className="zd-input w-full rounded-lg px-3 py-2.5 text-sm" defaultValue={user.email} disabled />
          </div>
        </div>
        <p className="text-[11px] text-white/35 mt-3">Edição de perfil chega na próxima versão.</p>
      </div>

      <div className="zd-card rounded-2xl p-6">
        <h2 className="font-heading font-bold mb-3">Plano e créditos</h2>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-sm">Plano atual: <b className="zd-green uppercase">{user.plano}</b></div>
            <div className="text-xs text-white/45 mt-1">🌿 {user.creditos} de seiva disponível · estorno automático quando a IA falha</div>
          </div>
          <Link to="/planos" className="zd-gradient-btn rounded-lg px-5 py-2.5 text-sm">Ver planos →</Link>
        </div>
      </div>

      <div className="zd-card rounded-2xl p-6">
        <h2 className="font-heading font-bold mb-3">Gamificação</h2>
        <div className="text-sm text-white/60">Nível {user.nivel.nivel}: {user.nivel.nome} · {user.gamification.xp} XP · {user.gamification.conquistas.length} conquistas · streak {user.gamification.streak?.dias || 0}d</div>
        <p className="text-[11px] text-white/35 mt-2">Modo focado (desativar gamificação) disponível no plano BUSINESS.</p>
      </div>

      <div className="zd-card rounded-2xl p-6">
        <h2 className="font-heading font-bold mb-3">Dados e privacidade</h2>
        <p className="text-xs text-white/50">Seus dados são protegidos com criptografia. LGPD desde o dia 1: exportação e exclusão de conta chegam na próxima versão.</p>
      </div>
    </div>
  );
}
