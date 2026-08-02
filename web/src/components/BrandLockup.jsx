import React, { useState } from 'react';

// Lockup original do app: símbolo girando (zd-spin-logo, 4s) + wordmark
// "ZoomDev / IDEA TO EXIT" ao lado: assets originais em /assets/site/.
export default function BrandLockup({ symbolSize = 40, wordmarkHeight = 34, spin = true, className = '' }) {
  const [erroSimbolo, setErroSimbolo] = useState(false);
  const [erroNome, setErroNome] = useState(false);

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {!erroSimbolo ? (
        <img
          src="/assets/site/simbolo-2.png"
          alt="ZoomDev"
          className={spin ? 'zd-spin-logo' : ''}
          style={{ width: symbolSize, height: symbolSize, objectFit: 'contain', mixBlendMode: 'screen', filter: 'drop-shadow(0 0 8px rgba(0,200,255,.35))' }}
          onError={() => setErroSimbolo(true)}
        />
      ) : (
        <img src="/assets/logo.png" alt="ZoomDev" style={{ width: symbolSize, height: symbolSize, objectFit: 'contain' }} />
      )}
      {!erroNome ? (
        <img
          src="/assets/site/wordmark.png"
          alt="ZoomDev: Idea to Exit"
          style={{ height: wordmarkHeight, width: 'auto', objectFit: 'contain' }}
          onError={() => setErroNome(true)}
        />
      ) : (
        <div>
          <div className="font-heading font-bold text-lg leading-none text-white">ZoomDev <span className="zd-green">OS</span></div>
          <div className="text-[10px] tracking-[.25em] text-white/40 mt-1">IDEA TO EXIT</div>
        </div>
      )}
    </div>
  );
}
