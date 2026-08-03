import React, { useState } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// AVATAR DE AGENTE: ponto único de verdade para exibir a arte de um agente.
//
// Regra de enquadramento, decidida pelo fundador:
//
//   MAIÁ    mantém o recorte de rosto dentro da moldura chanfrada. Ela é o
//           copiloto, aparece no chat e na barra lateral em tamanho pequeno,
//           e ali o rosto precisa preencher o espaço.
//
//   DEMAIS  aparecem INTEIROS, sem moldura e sem corte. object-contain em vez
//           de object-cover: a arte se ajusta ao espaço disponível e nenhuma
//           parte do personagem fica de fora. O brilho vem de drop-shadow na
//           silhueta, não de uma borda em volta.
//
// Nunca renderiza <img> sem src: o navegador exibiria o texto do alt e o
// componente ficaria quebrado. Sem arte, cai no emoji dentro de um quadro
// discreto, que aí sim precisa de contorno para não flutuar solto.
// ═══════════════════════════════════════════════════════════════════════════

/** Aceita o objeto da API (com rosto/retrato/avatar) ou apenas o id. */
function resolver(agente) {
  if (!agente) return {};
  if (typeof agente === 'string') {
    return {
      id: agente,
      rosto: `/assets/agents/faces/${agente}.webp`,
      retrato: `/assets/agents/${agente}.webp`,
    };
  }
  const id = agente.id || agente.agenteId;
  return {
    id,
    nome: agente.nome || agente.agenteNome,
    emoji: agente.emoji || agente.agenteEmoji,
    cor: agente.cor,
    // `imagem` mantém compatibilidade com os seeds antigos
    rosto: agente.rosto || (id ? `/assets/agents/faces/${id}.webp` : null),
    retrato: agente.retrato || agente.imagem || (id ? `/assets/agents/${id}.webp` : null),
  };
}

// ── Escolha do tamanho pelo navegador ─────────────────────────────────────
// Cada retrato existe em duas larguras: 160 e 512. Em vez de decidir aqui qual
// usar, o srcset entrega as duas e o `sizes` diz o tamanho real da caixa; o
// navegador escolhe sozinho, já considerando a densidade da tela.
//
// A tela de elenco desenha vinte e cinco retratos em cartões de 56 pontos.
// Servindo só o de 512, ela baixava 1,2 MB para desenhar polegares.
//
// A largura sai da classe do Tailwind: `w-14` é 3,5rem, ou seja, 56 pixels. A
// escala é sempre o número vezes quatro, e é por isso que dá para derivar em
// vez de repetir o valor em toda chamada.
const CAIXA_PADRAO = 64;

function larguraDe(classes) {
  const n = Number(String(classes).match(/(?:^|\s)w-(\d+)(?:\s|$)/)?.[1]);
  return Number.isFinite(n) ? n * 4 : CAIXA_PADRAO;
}

const miniDe = (url) => (url && url.endsWith('.webp') ? url.replace(/\.webp$/, '-mini.webp') : null);

export default function AgentAvatar({
  agente,
  size = 'w-16 h-16',
  emojiSize = 'text-2xl',
  className = '',
  centralizar = true,
}) {
  const a = resolver(agente);
  const ehMaia = a.id === 'maia';
  const [falhou, setFalhou] = useState(false);

  const cor = a.cor || '#00ff64';
  // A Maiá usa o recorte de rosto; os demais, o retrato inteiro.
  const src = falhou ? null : (ehMaia ? (a.rosto || a.retrato) : a.retrato);
  const base = `${size} ${centralizar ? 'mx-auto' : ''} shrink-0 flex items-center justify-center ${emojiSize} ${className}`;
  const larguraCaixa = larguraDe(size);
  const mini = miniDe(a.retrato);

  if (!src) {
    return (
      <div className={`${base} hud-corte`}
        style={{ '--c': '6px', background: `${cor}12`, boxShadow: `inset 0 0 0 1px ${cor}33` }}
        title={`${a.nome || 'Agente'} · avatar em produção`}>
        <span aria-label={a.nome}>{a.emoji || '•'}</span>
      </div>
    );
  }

  if (ehMaia) {
    return (
      <div className={`${base} hud-corte overflow-hidden`}
        style={{ '--c': '7px', boxShadow: `inset 0 0 0 1px ${cor}44, 0 0 16px ${cor}30` }}
        title={a.nome}>
        <img src={src} alt={a.nome || ''} loading="lazy" onError={() => setFalhou(true)}
          className="w-full h-full object-cover object-center" />
      </div>
    );
  }

  return (
    <div className={base} title={a.nome}>
      <img
        src={src}
        srcSet={mini ? `${mini} 160w, ${src} 512w` : undefined}
        sizes={mini ? `${larguraCaixa}px` : undefined}
        alt={a.nome || ''}
        loading="lazy"
        decoding="async"
        onError={() => setFalhou(true)}
        className="max-w-full max-h-full w-auto h-auto object-contain"
        style={{ filter: `drop-shadow(0 0 10px ${cor}55) drop-shadow(0 3px 6px rgba(0,0,0,.55))` }}
      />
    </div>
  );
}
