import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { supabaseConfigurado, supabaseFetch } from '../server/src/services/supabase.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arquivo = path.join(raiz, 'server', 'data', 'db.json');
const aplicar = process.argv.includes('--apply');

if (!fs.existsSync(arquivo)) throw new Error(`Banco JSON não encontrado: ${arquivo}`);
if (!supabaseConfigurado()) throw new Error('Supabase não configurado. Preencha server/.env antes de importar.');

const db = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
const usuarios = Object.values(db.users || {});
const projetos = Object.values(db.projects || {});
const agora = new Date().toISOString();

const paraUsuario = u => ({
  id: u.id,
  email: u.email,
  nome: u.nome || String(u.email || '').split('@')[0] || 'Fundador',
  papel: u.papel || null,
  ativo: u.ativo !== false,
  plano: u.plano || 'free',
  creditos: Number.isFinite(u.creditos) ? u.creditos : 0,
  gamification: u.gamification || {},
  criado_em: u.criadoEm || agora,
  atualizado_em: agora,
});

const paraProjeto = p => ({
  id: p.id,
  user_id: p.userId,
  nome: p.nome || 'Projeto sem nome',
  descricao: p.descricao || '',
  classificacao: p.classificacao || null,
  vertical: p.vertical || null,
  fase: p.fase || null,
  publicado: Boolean(p.publicado),
  dados: p,
  criado_em: p.criadoEm || agora,
  atualizado_em: agora,
});

const invalidos = projetos.filter(p => !p.id || !p.userId || !db.users?.[p.userId]);
if (invalidos.length) throw new Error(`${invalidos.length} projeto(s) sem usuário válido; importação cancelada.`);

console.log(JSON.stringify({ modo: aplicar ? 'APLICAR' : 'SIMULACAO', usuarios: usuarios.length, projetos: projetos.length }, null, 2));
if (!aplicar) {
  console.log('Nenhum dado foi alterado. Execute novamente com --apply para importar.');
  process.exit(0);
}

async function upsert(tabela, linhas, conflito) {
  if (!linhas.length) return 0;
  const resposta = await supabaseFetch(`/${tabela}?on_conflict=${encodeURIComponent(conflito)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(linhas),
  });
  if (!resposta.ok) throw new Error(`Falha ao importar ${tabela}: HTTP ${resposta.status} ${await resposta.text()}`);
  return linhas.length;
}

const totalUsuarios = await upsert('zoomdev_users', usuarios.map(paraUsuario), 'id');
const totalProjetos = await upsert('zoomdev_projects', projetos.map(paraProjeto), 'id');
console.log(JSON.stringify({ importados: { usuarios: totalUsuarios, projetos: totalProjetos }, origem: arquivo }, null, 2));