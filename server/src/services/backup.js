// ═══════════════════════════════════════════════════════════════════════════
// BACKUP — cópias rotativas do banco dentro do volume.
//
// O volume protege contra a troca de imagem no deploy; não protege contra
// escrita corrompida, exclusão acidental ou um bug que zere uma coleção. Sete
// cópias diárias resolvem o caso comum: perceber no dia seguinte que algo
// sumiu e voltar um dia atrás.
//
// A cópia é feita por leitura e reescrita, não por rename, porque o arquivo
// de origem continua vivo e sendo escrito pelo processo. E a gravação é
// atômica: escreve em .tmp e renomeia, de modo que uma queda no meio nunca
// deixa um backup pela metade se passando por íntegro.
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';

const PASTA = path.join(config.dataDir, 'backups');
const MANTER = 7;
const INTERVALO_MS = 24 * 60 * 60 * 1000;

function arquivoBanco() {
  return path.join(config.dataDir, 'db.json');
}

export function listarBackups() {
  try {
    return fs.readdirSync(PASTA)
      .filter(f => f.startsWith('db-') && f.endsWith('.json'))
      .sort()
      .reverse()
      .map(f => {
        const s = fs.statSync(path.join(PASTA, f));
        return { arquivo: f, bytes: s.size, em: s.mtime.toISOString() };
      });
  } catch { return []; }
}

/** Executa uma cópia. Devolve o resultado em vez de lançar: backup que
 *  derruba o servidor é pior do que backup que falha e avisa. */
export function copiar() {
  try {
    const origem = arquivoBanco();
    if (!fs.existsSync(origem)) return { ok: false, motivo: 'banco ainda não existe' };

    fs.mkdirSync(PASTA, { recursive: true });
    const conteudo = fs.readFileSync(origem, 'utf8');

    // Só copia se for JSON válido: preservar um arquivo corrompido como
    // "backup" transformaria a rede de segurança em armadilha.
    try { JSON.parse(conteudo); }
    catch { return { ok: false, motivo: 'banco atual não é JSON válido, cópia abortada' }; }

    const dia = new Date().toISOString().slice(0, 10);
    const destino = path.join(PASTA, `db-${dia}.json`);
    const temporario = `${destino}.tmp`;
    fs.writeFileSync(temporario, conteudo);
    fs.renameSync(temporario, destino);

    // Rotação: mantém as sete cópias mais recentes.
    const sobrando = listarBackups().slice(MANTER);
    for (const b of sobrando) {
      try { fs.unlinkSync(path.join(PASTA, b.arquivo)); } catch { /* já foi */ }
    }

    return { ok: true, arquivo: path.basename(destino), bytes: Buffer.byteLength(conteudo), mantidos: Math.min(listarBackups().length, MANTER) };
  } catch (e) {
    console.error('backup: falhou', e.message);
    return { ok: false, motivo: e.message };
  }
}

export function agendarBackup() {
  const primeira = copiar();
  console.log(primeira.ok
    ? `backup: ${primeira.arquivo} (${(primeira.bytes / 1024).toFixed(1)} KB)`
    : `backup: não executado (${primeira.motivo})`);
  const timer = setInterval(copiar, INTERVALO_MS);
  timer.unref?.();
  return timer;
}
