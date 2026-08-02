// ═══════════════════════════════════════════════════════════════════════════
// AVATARES DOS AGENTES
//
// Dois formatos por agente, ambos opcionais:
//   agents/<id>.png        retrato completo: cards grandes e corpo no vale 3D
//   agents/faces/<id>.png  recorte quadrado do rosto: avatares pequenos,
//                          chat e a face do personagem voxel
//
// Basta soltar o arquivo no diretório: a detecção é por leitura de diretório
// com cache invalidado por mtime, sem tocar em código.
//
// Os caminhos são resolvidos a partir DESTE módulo, nunca de process.cwd():
// em produção o processo roda com o diretório de trabalho em server/.
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';

const EXT = /\.(png|jpg|jpeg|webp)$/i;

// public/ vem primeiro: é a fonte da verdade e existe também na imagem de
// produção (o Dockerfile copia o projeto inteiro). O dist/ fica como reserva
// para o caso de um deploy que só carregue o build.
const RAIZES = [
  new URL('../../../web/public/assets/agents/', import.meta.url).pathname,
  new URL('../../../web/dist/assets/agents/', import.meta.url).pathname,
];

const cache = { retratos: null, rostos: null };

function ler(subdir, chave) {
  try {
    const base = RAIZES.find(r => fs.existsSync(r));
    if (!base) return new Set();
    const dir = subdir ? `${base}${subdir}/` : base;
    if (!fs.existsSync(dir)) return new Set();

    const mtime = fs.statSync(dir).mtimeMs;
    const c = cache[chave];
    if (!c || c.dir !== dir || c.mtime !== mtime) {
      cache[chave] = {
        dir, mtime,
        ids: new Set(fs.readdirSync(dir).filter(f => EXT.test(f)).map(f => f.replace(/\.[^.]+$/, ''))),
      };
    }
    return cache[chave].ids;
  } catch {
    return new Set();
  }
}

/** Retrato completo do agente, ou null. */
export function retratoDe(id) {
  return ler('', 'retratos').has(id) ? `/assets/agents/${id}.png` : null;
}

/** Recorte quadrado do rosto, ou null. */
export function rostoDe(id) {
  return ler('faces', 'rostos').has(id) ? `/assets/agents/faces/${id}.png` : null;
}

/** Melhor imagem para um avatar pequeno: rosto se houver, senão o retrato. */
export function avatarDe(id) {
  return rostoDe(id) || retratoDe(id);
}

/** Conjunto completo para o cliente decidir o enquadramento. */
export function imagensDe(id) {
  const rosto = rostoDe(id);
  const retrato = retratoDe(id);
  return { rosto, retrato, avatar: rosto || retrato, temArte: Boolean(rosto || retrato) };
}
