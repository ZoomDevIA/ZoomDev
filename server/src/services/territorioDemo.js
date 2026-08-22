// Semeadura única do território demonstrativo, compartilhada pelas rotas
// autenticadas (/territorio) e pela pública (/publico/passaporte): quem
// chegar primeiro planta, e as cadeias nascem pelo registrador real.
import { store } from '../store.js';
import { SEMENTES_EVIDENCIA } from '../data/territorio.js';
import { registrarEvidencia } from './custodia.js';

let semeado = false;

export function semearSePreciso() {
  if (semeado) return;
  semeado = true;
  for (const [loteId, sementes] of Object.entries(SEMENTES_EVIDENCIA)) {
    if ((store.evidencias[loteId] || []).length) continue;
    for (const s of sementes) registrarEvidencia({ loteId, ...s });
  }
}
