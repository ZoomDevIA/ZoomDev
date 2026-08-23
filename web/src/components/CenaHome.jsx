import React from 'react';
import './cena-home.css';

// ═══════════════════════════════════════════════════════════════════════════
// CENA DA HOME · Horizonte Vivo
//
// O fundo escolhido pelo fundador para a porta de entrada: céu estrelado,
// cordilheira wireframe, chão de grade em perspectiva deslizando, e a órbita
// dos nove módulos da plataforma ao redor da caixa de ideação. Tudo CSS e
// SVG inline: zero imagem para baixar, e as preferências de tema claro,
// textura e movimento são respeitadas na folha de estilo da cena.
// ═══════════════════════════════════════════════════════════════════════════

// Os nove módulos que orbitam a ideia, em traço de linha (tech + bio):
// chip de IA, rede neural, código, satélite, CO₂ capturado, cadeia de
// custódia, folha-circuito, DNA (biotecnologia) e foguete.
const ICONES = [
  ['chip', <g key="chip"><rect x="7" y="7" width="10" height="10" rx="1.5" /><rect x="10.5" y="10.5" width="3" height="3" /><path d="M9 7V4M15 7V4M9 20v-3M15 20v-3M7 9H4M7 15H4M20 9h-3M20 15h-3" /></g>],
  ['neural', <g key="neural"><circle cx="12" cy="5" r="1.8" /><circle cx="5" cy="17" r="1.8" /><circle cx="19" cy="17" r="1.8" /><circle cx="12" cy="12" r="1.4" /><path d="M12 6.8v3.8M10.9 13 6.3 15.9M13.1 13l4.6 2.9" /></g>],
  ['codigo', <path key="codigo" d="M9 8l-4 4 4 4M15 8l4 4-4 4" />],
  ['satelite', <g key="satelite"><rect x="9.6" y="9.6" width="4.8" height="4.8" transform="rotate(45 12 12)" /><path d="M3.5 12H7M17 12h3.5M8.5 5.5a6 6 0 0 1 7 0" /><rect x="2" y="10.6" width="2.6" height="2.8" /><rect x="19.4" y="10.6" width="2.6" height="2.8" /></g>],
  ['co2', <g key="co2"><path d="M7.2 14.5a3.6 3.6 0 1 1 .9-7.1A4.6 4.6 0 0 1 17 8.6a3 3 0 0 1-.6 5.9z" /><path d="M9 17.5v2.6m-1.2-1.3 1.2 1.3 1.2-1.3M12 17.5v2.6m-1.2-1.3 1.2 1.3 1.2-1.3M15 17.5v2.6m-1.2-1.3 1.2 1.3 1.2-1.3" /></g>],
  ['corrente', <g key="corrente"><rect x="3.6" y="11.2" width="8.6" height="5.6" rx="2.8" transform="rotate(-45 7.9 14)" /><rect x="11.8" y="7.2" width="8.6" height="5.6" rx="2.8" transform="rotate(-45 16.1 10)" /></g>],
  ['folha', <g key="folha"><path d="M12 3C7.2 8 5.4 12.4 12 21c6.6-8.6 4.8-13-0-18z" /><path d="M12 7.5V17M12 10.5l2.4-1.6M12 13.5l-2.4-1.6" /></g>],
  ['dna', <g key="dna"><path d="M8.5 3c0 4.2 7 4.8 7 9s-7 4.8-7 9M15.5 3c0 4.2-7 4.8-7 9s7 4.8 7 9" /><path d="M9.4 6.2h5.2M8.6 12h6.8M9.4 17.8h5.2" /></g>],
  ['foguete', <g key="foguete"><path d="M12 3.2c2.9 2 3.9 5.8 3.9 8.8L12 15.8 8.1 12c0-3 1-6.8 3.9-8.8z" /><circle cx="12" cy="9" r="1.5" /><path d="M9.8 16.8 9 20M14.2 16.8 15 20" /></g>],
];

// Geometria da elipse (o mesmo desenho aprovado no mockup)
const CX = 625, CY = 415, RX = 585, RY = 360;
const angulo = (i, n, meio = 0) => ((i + meio) / n) * 2 * Math.PI - Math.PI / 2;

const NOS = ICONES.map(([id, el], i) => {
  const a = angulo(i, ICONES.length);
  return { id, el, i, x: CX + RX * Math.cos(a) - 32, y: CY + RY * Math.sin(a) - 32 };
});
const PONTOS = ICONES.map((_, i) => {
  const a = angulo(i, ICONES.length, 0.5);
  return { x: CX + RX * Math.cos(a) - 4, y: CY + RY * Math.sin(a) - 4 };
});

export default function CenaHome() {
  return (
    <div className="cena-home" aria-hidden="true">
      <div className="cena-ceu" />
      <div className="cena-montes" />
      <div className="cena-chao" />
      <div className="cena-orbita">
        <svg className="cena-aneis" viewBox="0 0 1250 830">
          <ellipse className="anel a1" cx={CX} cy={CY} rx={RX} ry={RY} pathLength="100" />
          <ellipse className="anel a2" cx={CX} cy={CY} rx={RX - 90} ry={RY - 62} pathLength="100" />
        </svg>
        {NOS.map(n => (
          <span key={n.id} className="cena-no" style={{ left: n.x, top: n.y, '--i': n.i }}>
            <svg viewBox="0 0 24 24">{n.el}</svg>
          </span>
        ))}
        {PONTOS.map((p, i) => (
          <span key={i} className="cena-ponto" style={{ left: p.x, top: p.y }} />
        ))}
        <span className="cena-satelite s1" />
        <span className="cena-satelite s2" />
      </div>
      <div className="cena-veu" />
    </div>
  );
}
