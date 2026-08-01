import React, { createContext, useContext } from 'react';

export const ToastContext = createContext({ toasts: [], notify: () => {} });

export default function GamificationToasts() {
  const { toasts } = useContext(ToastContext);
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map(t => (
        <div key={t.id} className="zd-notification zd-pop rounded-xl px-4 py-3 shadow-xl">
          <div className={`font-heading font-bold text-sm ${t.tipo === 'conquista' ? 'zd-blue' : 'zd-green'}`}>{t.titulo}</div>
          {t.detalhe && <div className="text-xs text-white/60 mt-0.5">{t.detalhe}</div>}
        </div>
      ))}
    </div>
  );
}
