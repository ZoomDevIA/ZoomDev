// Cliente Claude com roteador de modelos: cada módulo declara seu papel e o
// modelo em vigor é resolvido NA HORA da chamada (o administrador troca pelo
// painel e a próxima chamada já sai no modelo novo). Este arquivo também
// ajusta os parâmetros que mudam entre tiers.
// Sem ANTHROPIC_API_KEY, cai em modo demo (o chamador fornece o mock).
import { config } from '../config.js';
import { modeloDoPapel } from '../services/modelosIA.js';

let _client = null;
async function client() {
  if (!_client) {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    _client = new Anthropic();
  }
  return _client;
}

// ── O que muda de um tier para o outro ──────────────────────────────────────
// - effort: existe do Opus 4.5 para cima; o Haiku recusa o parâmetro.
// - fallbacks "default" (recusa re-servida por outro modelo no mesmo call):
//   recurso dos tiers Fable 5 / Opus 5; nos demais, não enviar.
// - thinking: nunca enviamos o parâmetro; no Fable é sempre ativo, no Sonnet 5
//   omitir significa adaptativo, no Haiku significa desligado, e os três
//   comportamentos são exatamente os que queremos por papel.
function porTier(modelo, effort) {
  const p = {};
  if (!/haiku/.test(modelo)) p.output_config = { effort };
  if (/fable-5|opus-5/.test(modelo)) {
    p.betas = ['server-side-fallback-2026-07-01'];
    p.fallbacks = 'default';
  }
  return p;
}

// Prompt de sistema com cache: os PICs e personas são idênticos a cada
// chamada, e a leitura em cache custa ~10% do preço cheio. Prefixos curtos
// (< ~1024 tokens) simplesmente não são cacheados, sem erro.
function sistemaCacheado(system) {
  if (!system) return undefined;
  return [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }];
}

// `papel` (plano, pesquisa, codigo, chat, extracao, gerado) resolve o modelo
// em vigor no momento da chamada; `modelo` explícito ganha do papel; sem os
// dois, vale o modelo principal.
const resolver = (modelo, papel) => modelo || (papel ? modeloDoPapel(papel) : config.model);

/**
 * Chamada estruturada: retorna um objeto validado contra o JSON Schema.
 */
export async function structured({ system, user, schema, effort = 'high', maxTokens = 16000, modelo: modeloFixo, papel }) {
  const modelo = resolver(modeloFixo, papel);
  if (!config.hasApiKey) {
    throw Object.assign(new Error('Sem ANTHROPIC_API_KEY: use o modo demo.'), { code: 'NO_API_KEY' });
  }
  const anthropic = await client();
  const extra = porTier(modelo, effort);
  const stream = anthropic.beta.messages.stream({
    model: modelo,
    max_tokens: maxTokens,
    ...extra,
    output_config: { ...(extra.output_config || {}), format: { type: 'json_schema', schema } },
    system: sistemaCacheado(system),
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

/**
 * Conversa em texto livre (Zoom Intelligence / copiloto).
 * messages: [{role:'user'|'assistant', content}]
 */
export async function conversar({ system, messages, effort = 'medium', maxTokens = 4000, modelo: modeloFixo, papel }) {
  const modelo = resolver(modeloFixo, papel);
  if (!config.hasApiKey) {
    throw Object.assign(new Error('Sem ANTHROPIC_API_KEY: use o modo demo.'), { code: 'NO_API_KEY' });
  }
  const anthropic = await client();
  const stream = anthropic.beta.messages.stream({
    model: modelo,
    max_tokens: maxTokens,
    ...porTier(modelo, effort),
    system: sistemaCacheado(system),
    messages,
  });
  const response = await stream.finalMessage();
  if (response.stop_reason === 'refusal') {
    throw Object.assign(new Error('Não posso ajudar com esse pedido: reformule, por favor.'), { code: 'REFUSAL' });
  }
  return response.content.filter(b => b.type === 'text').map(b => b.text).join('');
}

/**
 * Conversa com acesso à internet em tempo real (Sexta-Feira, radar, plano).
 * Usa o server tool web_search; `pause_turn` é retomado re-enviando o conteúdo
 * do assistant como está (sem texto extra), até ~4 iterações.
 * O web_search_20260209 pede Sonnet 4.6+/Opus 4.6+: não rotear para o Haiku.
 * Retorna { texto, buscas }: buscas = quantas pesquisas o modelo executou.
 */
export async function conversarComInternet({ system, messages, effort = 'high', maxTokens = 8000, maxBuscas = 5, modelo: modeloFixo, papel }) {
  const modelo = resolver(modeloFixo, papel);
  if (!config.hasApiKey) {
    throw Object.assign(new Error('Sem ANTHROPIC_API_KEY: use o modo demo.'), { code: 'NO_API_KEY' });
  }
  const anthropic = await client();
  let msgs = [...messages];
  let response = null;
  for (let i = 0; i < 4; i++) {
    const stream = anthropic.beta.messages.stream({
      model: modelo,
      max_tokens: maxTokens,
      ...porTier(modelo, effort),
      system: sistemaCacheado(system),
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: maxBuscas }],
      messages: msgs,
    });
    response = await stream.finalMessage();
    if (response.stop_reason !== 'pause_turn') break;
    msgs = [...msgs, { role: 'assistant', content: response.content }];
  }
  if (response.stop_reason === 'refusal') {
    throw Object.assign(new Error('Não posso ajudar com esse pedido: reformule, por favor.'), { code: 'REFUSAL' });
  }
  const buscas = response.content.filter(b => b.type === 'server_tool_use').length;
  const texto = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
  return { texto, buscas };
}

// Exposto para os testes: a regra de parâmetros por tier é código, não fé.
export const _interno = { porTier, sistemaCacheado };
