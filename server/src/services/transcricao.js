// ═══════════════════════════════════════════════════════════════════════════
// TRANSCRIÇÃO DE ÁUDIO — Deepgram
//
// Escolhido pelo fundador entre as opções avaliadas. As razões que
// sustentaram a escolha, para quem for revisar isto depois:
//
//   · português brasileiro nativo no modelo nova-3, sem gambiarra de idioma
//   · pontuação e separação de falantes na mesma chamada, o que importa muito
//     quando o anexo é a gravação de uma reunião com sócio ou cliente
//   · cobrança por minuto de áudio, sem mensalidade: um projeto que não
//     transcreve nada não paga nada
//   · envio do binário direto, sem precisar hospedar o arquivo antes
//
// Sem DEEPGRAM_API_KEY o recurso simplesmente não se anuncia: a caixa de
// contexto continua aceitando ditado pelo navegador, que é gratuito e roda no
// próprio aparelho. Recurso que aparece e falha no clique é pior que recurso
// que não aparece.
// ═══════════════════════════════════════════════════════════════════════════

const ENDERECO = 'https://api.deepgram.com/v1/listen';
const TEMPO_LIMITE_MS = 120_000;

export function transcricaoDisponivel() {
  return Boolean((process.env.DEEPGRAM_API_KEY || '').trim());
}

export function modoTranscricao() {
  return transcricaoDisponivel() ? 'deepgram' : 'navegador';
}

/**
 * Transcreve um áudio inteiro.
 * Recebe { buffer, mime, nome, idioma } e devolve
 * { texto, duracao, idioma, falantes, confianca }.
 */
export async function transcrever({ buffer, mime = 'audio/mpeg', nome = 'audio', idioma = 'pt-BR' }) {
  const chave = (process.env.DEEPGRAM_API_KEY || '').trim();
  if (!chave) throw erro(503, 'DEEPGRAM_API_KEY não configurada.');

  const parametros = new URLSearchParams({
    model: 'nova-3',
    language: idioma,
    punctuate: 'true',
    smart_format: 'true',
    diarize: 'true',       // separa os falantes: reunião vira transcrição legível
    paragraphs: 'true',
    filler_words: 'false', // "é…", "tipo assim" não ajudam a entender a ideia
  });

  const corte = AbortSignal.timeout
    ? AbortSignal.timeout(TEMPO_LIMITE_MS)
    : undefined;

  let resposta;
  try {
    resposta = await fetch(`${ENDERECO}?${parametros}`, {
      method: 'POST',
      headers: { Authorization: `Token ${chave}`, 'Content-Type': mime || 'application/octet-stream' },
      body: buffer,
      signal: corte,
    });
  } catch (e) {
    if (e.name === 'TimeoutError' || e.name === 'AbortError') {
      throw erro(504, `${nome}: a transcrição passou de dois minutos e foi interrompida. Envie um trecho menor.`);
    }
    throw erro(502, `Não consegui falar com o serviço de transcrição: ${e.message}`);
  }

  if (!resposta.ok) {
    const corpo = await resposta.text().catch(() => '');
    throw erro(mapaStatus(resposta.status), mensagemDeFalha(resposta.status, corpo));
  }

  const dados = await resposta.json();
  const canal = dados?.results?.channels?.[0];
  const alternativa = canal?.alternatives?.[0];

  // Com diarização, os parágrafos por falante leem muito melhor que o
  // transcript corrido. Quando não vierem, cai no transcript simples.
  const paragrafos = alternativa?.paragraphs?.paragraphs;
  const texto = paragrafos?.length
    ? montarComFalantes(paragrafos)
    : (alternativa?.transcript || '').trim();

  return {
    texto,
    duracao: dados?.metadata?.duration ?? null,
    idioma,
    falantes: contarFalantes(paragrafos),
    confianca: alternativa?.confidence ?? null,
  };
}

function montarComFalantes(paragrafos) {
  const linhas = [];
  let anterior = null;
  for (const p of paragrafos) {
    const falante = p.speaker;
    const frase = (p.sentences || []).map(s => s.text).join(' ').trim();
    if (!frase) continue;
    if (falante != null && falante !== anterior) {
      linhas.push(`\nFalante ${falante + 1}: ${frase}`);
      anterior = falante;
    } else {
      linhas.push(frase);
    }
  }
  return linhas.join(' ').replace(/\n /g, '\n').trim();
}

function contarFalantes(paragrafos) {
  if (!paragrafos?.length) return null;
  const s = new Set(paragrafos.map(p => p.speaker).filter(x => x != null));
  return s.size || null;
}

const mapaStatus = (s) => ({ 401: 401, 402: 402, 403: 403, 413: 413, 429: 429 }[s] || 502);

function mensagemDeFalha(status, corpo) {
  if (status === 401 || status === 403) {
    return 'A chave do serviço de transcrição foi recusada. Confira DEEPGRAM_API_KEY nas variáveis de ambiente.';
  }
  if (status === 402) return 'O crédito do serviço de transcrição acabou.';
  if (status === 413) return 'O áudio é grande demais para transcrição. Envie um trecho menor.';
  if (status === 429) return 'Muitas transcrições ao mesmo tempo. Tente de novo em instantes.';
  const detalhe = String(corpo || '').slice(0, 160);
  return `Falha na transcrição (${status})${detalhe ? `: ${detalhe}` : '.'}`;
}

function erro(status, mensagem) {
  return Object.assign(new Error(mensagem), { status });
}
