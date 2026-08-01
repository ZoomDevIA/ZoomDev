import React from 'react';

// Barra da jornada gamificada: Ideação → Validação → MVP → Tração → Escala
// com níveis bio-amazônicos (Semente → Floresta)
export default function JourneyBar({ jornada }) {
  if (!jornada?.length) return null;
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2">
      {jornada.map((j, i) => (
        <React.Fragment key={j.fase}>
          {i > 0 && <div className="journey-line min-w-6" />}
          <div className={`journey-node ${j.status} shrink-0 border rounded-xl px-3 py-2 text-center min-w-[92px]`}
            title={j.status === 'bloqueada' ? 'Complete a fase anterior para desbloquear' : j.label}>
            <div className="text-lg leading-none">{j.nivel?.emoji}</div>
            <div className="text-[11px] font-semibold mt-1">{j.label}</div>
            <div className="text-[9px] text-white/45">{j.nivel?.nome}</div>
            {j.status === 'concluida' && <div className="text-[10px] zd-green mt-0.5">✓ concluída</div>}
            {j.status === 'atual' && <div className="text-[10px] zd-blue mt-0.5">● em andamento</div>}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
