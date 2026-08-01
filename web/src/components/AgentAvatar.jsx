import React, { useState } from 'react';

// Avatar do agente: imagem original do app (quando existe) com fallback para emoji.
export default function AgentAvatar({ agente, size = 'w-16 h-16', rounded = 'rounded-2xl', emojiSize = 'text-2xl' }) {
  const [erro, setErro] = useState(false);

  if (agente.imagem && !erro) {
    return (
      <img
        src={agente.imagem}
        alt={agente.nome}
        loading="lazy"
        className={`${size} ${rounded} object-cover object-top mx-auto border border-white/10`}
        style={{ boxShadow: `0 0 18px ${agente.cor || '#00ff64'}30` }}
        onError={() => setErro(true)}
      />
    );
  }
  return (
    <div className={`${size} ${rounded} mx-auto flex items-center justify-center bg-white/[.05] border border-white/10 ${emojiSize}`}>
      {agente.emoji}
    </div>
  );
}
