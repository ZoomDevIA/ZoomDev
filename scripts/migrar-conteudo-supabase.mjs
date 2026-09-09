import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { supabaseConfigurado, supabaseFetch } from '../server/src/services/supabase.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pastaConteudo = path.join(raiz, 'server', 'data', 'conteudo');
const aplicar = process.argv.includes('--apply');

if (!supabaseConfigurado()) {
  throw new Error('Supabase não configurado. Preencha server/.env antes de importar.');
}

const arquivos = fs.existsSync(pastaConteudo)
  ? fs.readdirSync(pastaConteudo).filter(nome => /^[A-Za-z0-9_-]+\.json$/.test(nome))
  : [];

const registros = arquivos.map(nome => ({
  project_id: path.basename(nome, '.json'),
  dados: JSON.parse(fs.readFileSync(path.join(pastaConteudo, nome), 'utf8')),
  atualizado_em: new Date().toISOString(),
}));

console.log(JSON.stringify({
  modo: aplicar ? 'APLICAR' : 'SIMULACAO',
  conteudos: registros.length,
  origem: pastaConteudo,
}, null, 2));

if (!aplicar) {
  console.log('Nenhum dado foi alterado. Execute novamente com --apply após aplicar a migration 202609090002.');
  process.exit(0);
}

if (!registros.length) {
  console.log('Não há conteúdo local para importar.');
  process.exit(0);
}

const resposta = await supabaseFetch('/zoomdev_project_content?on_conflict=project_id', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=minimal',
  },
  body: JSON.stringify(registros),
});

if (!resposta.ok) {
  throw new Error(`Falha ao importar conteúdo: HTTP ${resposta.status} ${await resposta.text()}`);
}

console.log(JSON.stringify({ importados: { conteudos: registros.length } }, null, 2));
