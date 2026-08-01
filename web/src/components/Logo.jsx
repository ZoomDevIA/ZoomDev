import React, { useState } from 'react';

// Logo ZoomDev original (asset do app do fundador em /assets/logo.png),
// com fallback em SVG caso o arquivo não esteja disponível.
export default function Logo({ className = 'w-8 h-8' }) {
  const [erro, setErro] = useState(false);

  if (!erro) {
    return (
      <img
        src="/assets/logo.png"
        alt="ZoomDev"
        className={`${className} object-contain`}
        onError={() => setErro(true)}
      />
    );
  }

  return (
    <svg viewBox="0 0 48 48" className={className} aria-label="ZoomDev">
      <defs>
        <linearGradient id="lgreen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00ff64" />
          <stop offset="100%" stopColor="#00cc50" />
        </linearGradient>
        <linearGradient id="lblue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00c8ff" />
          <stop offset="100%" stopColor="#0077ff" />
        </linearGradient>
      </defs>
      <path d="M10 14 Q18 4 30 8 Q40 11 38 20 Q30 14 20 18 Q13 21 10 14 Z" fill="url(#lgreen)" />
      <path d="M38 34 Q30 44 18 40 Q8 37 10 28 Q18 34 28 30 Q35 27 38 34 Z" fill="url(#lblue)" />
    </svg>
  );
}
