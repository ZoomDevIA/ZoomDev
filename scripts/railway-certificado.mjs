// ═══════════════════════════════════════════════════════════════════════════
// DESTRAVAR CERTIFICADO DE DOMÍNIO NA RAILWAY
//
// POR QUE ISTO EXISTE. Quando o DNS de um domínio customizado é corrigido
// DEPOIS de a Railway já ter começado a validar, o trabalho de emissão fica
// preso em "in progress" para sempre. O painel não tem botão para isso, e o
// endpoint de nova tentativa recusa, porque ele só age sobre trabalho que
// FALHOU, não sobre trabalho travado. A única saída self-service é a mutation
// `customDomainIssueCertificate` da API pública.
//
// Referência: Railway Central Station, dois casos com o mesmo desfecho.
//   station.railway.com/questions/custom-domain-certificates-stuck-at-val-d9d135e5
//   station.railway.com/questions/custom-domains-never-register-on-the-edg-...
//
// SEGURANÇA. O token nunca é escrito em disco, nunca é impresso, e não entra
// como argumento de linha de comando (argumento aparece na lista de processos
// e no histórico do shell). Ele vem de variável de ambiente e só.
//
// USO:
//   export RAILWAY_TOKEN='...'                    # token de conta, não de projeto
//   node scripts/railway-certificado.mjs          # só LISTA, não muda nada
//   node scripts/railway-certificado.mjs --emitir # dispara a emissão nos travados
//
// Criar o token: railway.com/account/tokens
// ═══════════════════════════════════════════════════════════════════════════

const API = 'https://backboard.railway.com/graphql/v2';
const TOKEN = process.env.RAILWAY_TOKEN;
const EMITIR = process.argv.includes('--emitir');

if (!TOKEN) {
  console.error('Falta a variável RAILWAY_TOKEN.\n');
  console.error("  export RAILWAY_TOKEN='cole-o-token-aqui'");
  console.error('  node scripts/railway-certificado.mjs\n');
  console.error('Crie o token em railway.com/account/tokens (token de CONTA).');
  process.exit(1);
}

/** Uma chamada à API. Erro de GraphQL vem em 200, então precisa ser lido. */
async function api(query, variables = {}) {
  const r = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ query, variables }),
  });
  const texto = await r.text();
  let corpo;
  try { corpo = JSON.parse(texto); }
  catch { throw new Error(`resposta não é JSON (HTTP ${r.status}): ${texto.slice(0, 200)}`); }
  if (corpo.errors?.length) throw new Error(corpo.errors.map(e => e.message).join(' | '));
  return corpo.data;
}

// ── 1. Achar projeto, ambiente e serviço ───────────────────────────────────
const meu = await api(`
  query {
    me {
      projects {
        edges { node {
          id name
          environments { edges { node { id name } } }
          services     { edges { node { id name } } }
        } }
      }
    }
  }`);

const projetos = (meu?.me?.projects?.edges || []).map(e => e.node);
if (!projetos.length) {
  console.error('O token não enxerga nenhum projeto. Ele é de CONTA ou de projeto?');
  process.exit(1);
}

console.log('PROJETOS VISÍVEIS\n');
const alvos = [];
for (const p of projetos) {
  const ambientes = (p.environments?.edges || []).map(e => e.node);
  const servicos = (p.services?.edges || []).map(e => e.node);
  console.log(`  ${p.name}  (${p.id})`);
  for (const amb of ambientes) {
    for (const svc of servicos) {
      alvos.push({ projeto: p.name, projectId: p.id, environmentId: amb.id, serviceId: svc.id, amb: amb.name, svc: svc.name });
    }
  }
}

// ── 2. Listar os domínios customizados de cada combinação ──────────────────
const CONSULTA = `
  query domains($projectId: String!, $environmentId: String!, $serviceId: String!) {
    domains(projectId: $projectId, environmentId: $environmentId, serviceId: $serviceId) {
      customDomains {
        id
        domain
        status {
          certificateStatus
          dnsRecords { hostlabel requiredValue currentValue status }
        }
      }
    }
  }`;

const encontrados = [];
for (const a of alvos) {
  let d;
  try { d = await api(CONSULTA, a); } catch { continue; }
  for (const cd of d?.domains?.customDomains || []) {
    encontrados.push({ ...cd, contexto: a });
  }
}

if (!encontrados.length) {
  console.error('\nNenhum domínio customizado encontrado com este token.');
  process.exit(1);
}

console.log('\nDOMÍNIOS CUSTOMIZADOS\n');
const travados = [];
for (const cd of encontrados) {
  const cert = cd.status?.certificateStatus ?? '(sem status)';
  const pronto = String(cert).toUpperCase().includes('ISSUED');
  console.log(`  ${pronto ? 'OK    ' : 'TRAVADO'}  ${cd.domain.padEnd(24)} ${cert}`);
  console.log(`            id: ${cd.id}`);
  for (const r of cd.status?.dnsRecords || []) {
    const bate = r.currentValue === r.requiredValue;
    console.log(`            ${bate ? 'ok ' : 'NÃO'} ${String(r.hostlabel || '@').padEnd(20)} quer ${r.requiredValue}`);
    if (!bate) console.log(`                ${''.padEnd(20)} tem  ${r.currentValue ?? '(nada)'}`);
  }
  if (!pronto) travados.push(cd);
}

// ── 3. Disparar a emissão, se pedido ───────────────────────────────────────
if (!travados.length) {
  console.log('\nTodos os domínios já têm certificado. Nada a fazer.');
  process.exit(0);
}

if (!EMITIR) {
  console.log(`\n${travados.length} domínio(s) sem certificado.`);
  console.log('Para disparar a emissão neles, rode de novo com --emitir:\n');
  console.log('  node scripts/railway-certificado.mjs --emitir');
  process.exit(0);
}

console.log('\nDISPARANDO A EMISSÃO\n');
for (const cd of travados) {
  try {
    const d = await api(`mutation ($id: String!) { customDomainIssueCertificate(id: $id) }`, { id: cd.id });
    const ok = d?.customDomainIssueCertificate;
    console.log(`  ${ok ? 'aceito ' : 'recusou'}  ${cd.domain}`);
  } catch (e) {
    console.log(`  erro     ${cd.domain}: ${e.message.slice(0, 110)}`);
  }
}

console.log('\nA emissão leva de 1 a 2 minutos quando o DNS já está certo.');
console.log('Confira com:  bash scripts/conferir-dominios.sh');
