import { createContext, useContext, useEffect } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// MODO FOCO — o chassi sai da frente quando a tela é a oficina.
//
// O Studio é onde o fundador passa horas: duas janelas que precisam de altura.
// Ali, o menu lateral aberto e a barra de abas no topo somam quase 300 px de
// cromo que ninguém está usando. O modo foco recolhe os dois.
//
// Quem pede é a tela, não o chassi: a página declara que quer foco e o Layout
// obedece. Assim o Studio não precisa saber que existe uma barra lateral, e o
// Layout não precisa saber que existe um Studio.
//
// Nada é destrutivo. A preferência de menu recolhido que a pessoa já tinha é
// guardada na entrada e devolvida na saída, e `Esc` dispensa o foco a qualquer
// momento, sem sair da tela.
// ═══════════════════════════════════════════════════════════════════════════

export const FocoContext = createContext({ foco: false, pedirFoco: () => {} });

/** Sinal de que o chassi mudou de tamanho sem que a janela tenha mudado.
 *  Telas que medem a própria altura ouvem isto para não ficarem curtas. */
export const EVENTO_CHASSI = 'zd:chassi';

export function avisarChassi() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENTO_CHASSI));
}

/** Declara que esta tela quer o chassi recolhido enquanto estiver montada. */
export function useFoco(quer = true) {
  const { pedirFoco } = useContext(FocoContext);
  useEffect(() => {
    pedirFoco(quer);
    return () => pedirFoco(false);
  }, [quer, pedirFoco]);
}

export function useEstadoFoco() {
  return useContext(FocoContext);
}
