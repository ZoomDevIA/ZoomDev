import React, { useState } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// AVATAR DE AGENTE: ponto único de verdade para exibir a arte de um agente.
//
// Cascata: recorte do rosto (agents/faces/) → retrato (agents/) → emoji.
// Nunca renderiza <img> sem src: o navegador exibiria o texto do alt e o
// componente ficaria quebrado.
//
// Enquadramento: o recorte de rosto já vem centrado, então usa object-center;
// o retrato é vertical com o rosto no topo, então usa object-top.
// ═══════════════════════════════════════════════════════════════════════════

/** Aceita o objeto da API (com rosto/retrato/avatar) ou apenas o id. */
function resolver(agente) {
  if (!agente) return {};
  if (typeof agente === 'string') {
    return {
      id: agente,
      rosto: `/assets/agents/faces/${agente}.png`,
      retrato: `/assets/agents/${agente}.png`,
    };
  }
  const id = agente.id || agente.agenteId;
  return {
    id,
    nome: agente.nome || agente.agenteNome,
    emoji: agente.emoji || agente.agenteEmoji,
    cor: agente.cor,
    // `imagem` mantém compatibilidade com os seeds antigos
    rosto: agente.rosto || (id ? `/assets/agents/faces/${id}.png` : null),
    retrato: agente.retrato || agente.imagem || (id ? `/assets/agents/${id}.png` : null),
  };
}

export default function AgentAvatar({
  agente,
  size = 'w-16 h-16',
  rounded = 'rounded-2xl',
  emojiSize = 'text-2xl',
  className = '',
  centralizar = true,
}) {
  const a = resolver(agente);
  const [passo, setPasso] = useState(0); // 0 = rosto · 1 = retrato · 2 = emoji

  const src = passo === 0 ? a.rosto : passo === 1 ? a.retrato : null;
  const ehRosto = passo === 0;
  const cor = a.cor || '#00ff64';

  return (
    <div
      className={`${size} ${rounded} ${centralizar ? 'mx-auto' : ''} overflow-hidden border shrink-0 flex items-center justify-center ${emojiSize} ${className}`}
      style={{ borderColor: `${cor}33`, background: `${cor}12`, boxShadow: src ? `0 0 18px ${cor}30` : undefined }}
      title={src ? a.nome : `${a.nome || 'Agente'}: avatar em produção`}
    >
      {src ? (
        <img
          src={src}
          alt={a.nome || ''}
          loading="lazy"
          onError={() => setPasso(p => p + 1)}
          className={`w-full h-full object-cover ${ehRosto ? 'object-center' : 'object-top'}`}
        />
      ) : (
        <span aria-label={a.nome}>{a.emoji || '•'}</span>
      )}
    </div>
  );
}
