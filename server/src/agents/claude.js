// Cliente Claude (claude-fable-5) — geração estruturada com fallbacks e tratamento de recusa.
// Sem ANTHROPIC_API_KEY, cai em modo demo (o chamador fornece o mock).
import { config } from '../config.js';

let _client = null;
async function client() {
  if (!_client) {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    _client = new Anthropic();
  }
  return _client;
}

/**
 * Chamada estruturada: retorna um objeto validado contra o JSON Schema.
 * - claude-fable-5: thinking sempre ativo (não enviar o parâmetro), sem prefill.
 * - fallbacks "default": recusas de política são re-servidas por outro modelo no mesmo call.
 * - effort: 'low' para classificação, 'high' para geração de plano.
 */
export async function structured({ system, user, schema, effort = 'high', maxTokens = 16000 }) {
  if (!config.hasApiKey) {
    throw Object.assign(new Error('Sem ANTHROPIC_API_KEY — use o modo demo.'), { code: 'NO_API_KEY' });
  }
  const anthropic = await client();
  const stream = anthropic.beta.messages.stream({
    model: config.model,
    max_tokens: maxTokens,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system,
    output_config: {
      effort,
      format: { type: 'json_schema', schema },
    },
    messages: [{ role: 'user', content: user }],
  });
  const response = await stream.finalMessage();

  if (response.stop_reason === 'refusal') {
    throw Object.assign(new Error('A geração foi recusada pelos filtros de segurança. Reformule a descrição da ideia.'), { code: 'REFUSAL' });
  }
  if (response.stop_reason === 'max_tokens') {
    throw Object.assign(new Error('Resposta truncada (max_tokens). Tente novamente.'), { code: 'TRUNCATED' });
  }
  const text = response.content.find(b => b.type === 'text')?.text ?? '';
  try {
    return JSON.parse(text);
  } catch {
    throw Object.assign(new Error('A IA retornou um formato inesperado.'), { code: 'BAD_JSON' });
  }
}
