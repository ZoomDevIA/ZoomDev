// ═══════════════════════════════════════════════════════════════════════════
// CORPUS REGENERATIVO: camada INTERNA de calibração
//
// Destilado do acervo documental do fundador (laudos técnicos, informe técnico,
// instrumentos de fomento e material institucional) em parâmetros, protocolos e
// doutrinas operacionais.
//
// ⚠️ CONFIDENCIAL, NUNCA EXPOR:
// Este módulo não é servido por nenhuma rota pública. Ele não contém e não pode
// receber: nomes de entidades, cooperativas, pessoas ou instituições parceiras;
// CNPJs; valores de contrato; códigos de processo (SEI/ART/CRC); contagens de
// beneficiários; ou qualquer identificador rastreável até um documento.
//
// O que ele carrega é CONHECIMENTO: como a tecnologia se comporta, em que
// condições, com que confiança. O usuário sente a qualidade do dado sem
// nunca ver a fonte.
// ═══════════════════════════════════════════════════════════════════════════

/** Protocolo de aplicação consolidado a partir dos ensaios de campo. */
export const PROTOCOLO = {
  litrosPorHectare: 5,
  aplicacoesPorCiclo: 2,
  intervaloDias: 60,
  via: 'foliar',
  janelaRespostaFitossanitariaDias: 25,
  janelaRespostaRadicularDias: 120,
  observacao: 'Ação cumulativa: o fortalecimento é incorporado ao solo pelas folhas e restos culturais, ampliando o efeito nos ciclos seguintes.',
};

/**
 * Curva de resposta por condição do solo, o achado mais valioso do acervo:
 * o ganho é inversamente proporcional à qualidade inicial do solo.
 * Quanto mais degradado, maior a resposta. Isso inverte a lógica do agro
 * convencional e é o que torna a tecnologia relevante para agricultura familiar.
 */
export const RESPOSTA_POR_SOLO = {
  degradado: {
    id: 'degradado',
    nome: 'Degradado (ácido, sem correção)',
    descricao: 'pH abaixo de 5,5, saturação por bases muito baixa, matéria orgânica baixa, com estresse fitossanitário.',
    upliftProdutividade: 2.00,   // resposta de resgate documentada em laudo
    upliftBiomassa: 2.00,
    confianca: 'LAUDO',
    faixaIncerteza: [1.20, 2.00],
  },
  recuperacao: {
    id: 'recuperacao',
    nome: 'Em recuperação',
    descricao: 'Solo parcialmente corrigido, fertilidade média, sem estresse agudo.',
    upliftProdutividade: 0.80,
    upliftBiomassa: 0.70,
    confianca: 'CAMPO',
    faixaIncerteza: [0.40, 1.10],
  },
  corrigido: {
    id: 'corrigido',
    nome: 'Corrigido e manejado',
    descricao: 'Solo com calagem e adubação em dia, cultura sadia.',
    upliftProdutividade: 0.30,   // piso ancorado no ganho de área foliar
    upliftBiomassa: 0.30,
    confianca: 'LAUDO',
    faixaIncerteza: [0.15, 0.45],
  },
};

/** Efeitos agronômicos consolidados (sem citar origem documental). */
export const EFEITOS = {
  areaFoliar: { ganhoMinimo: 0.30, confianca: 'LAUDO', nota: 'Base física do sequestro adicional: mais área foliar, mais assimilação.' },
  enraizamento: { fator: 3.0, confianca: 'LAUDO', nota: 'Raízes mais profundas acessam água e nutrientes indisponíveis na superfície.' },
  resilienciaHidrica: { diasSemChuvaObservados: 58, confianca: 'CAMPO', nota: 'Exige sensor de umidade e testemunha instrumentada para virar métrica de MRV.' },
  fitossanidade: { confianca: 'LAUDO', nota: 'Aumento da resistência dos tecidos a fungos e bactérias; resposta visível em ~25 dias.' },
  biotaSolo: { confianca: 'CAMPO', nota: 'Retorno de polinizadores e recuperação da vida do solo em áreas tratadas.' },
};

/**
 * Arquétipos de escala: derivados de programas reais, TOTALMENTE ANONIMIZADOS.
 * Servem como presets da calculadora. Nenhum nome, valor ou entidade.
 */
export const ARQUETIPOS = [
  { id: 'familiar', nome: 'Propriedade familiar', hectares: 5, descricao: 'Agricultor familiar, policultura de subsistência e excedente.' },
  { id: 'cooperativa', nome: 'Cooperativa comunitária', hectares: 120, descricao: 'Grupo de produtores organizados em cooperativa ou associação.' },
  { id: 'regional', nome: 'Programa regional', hectares: 1100, descricao: 'Iniciativa territorial abrangendo múltiplas comunidades.' },
  { id: 'estadual', nome: 'Escala estadual', hectares: 25000, descricao: 'Cobertura da área agrícola de um estado de porte médio.' },
];

/** Mix de culturas típico de território amazônico (sem referência a programa). */
export const MIX_AMAZONICO = [
  { cultura: 'mandioca', participacao: 0.49 },
  { cultura: 'banana', participacao: 0.15 },
  { cultura: 'abacaxi', participacao: 0.09 },
  { cultura: 'cupuacu', participacao: 0.08 },
  { cultura: 'hortalicas', participacao: 0.06 },
  { cultura: 'melancia', participacao: 0.06 },
  { cultura: 'cacau', participacao: 0.04 },
  { cultura: 'acai', participacao: 0.03 },
];

// ═══════════════════════════════════════════════════════════════════════════
// DOUTRINAS: injetadas em TODOS os PICs (Sexta-Feira + 27 agentes)
// ═══════════════════════════════════════════════════════════════════════════

export const DOUTRINA_EVIDENCIA = `DOUTRINA DE EVIDÊNCIA (inegociável para todos os agentes)
- Toda alegação carrega um grau de confiança: 🏛️ Verificado 100% · 🌱 Laudo 90% · 🌾 Campo 80% · 📄 Pesquisa 75% · 🎯 Estratégia 60% · 💬 Hipótese 50% · ✨ Visão 10%.
- Regra do elo mais fraco: numa cadeia de raciocínio, o resultado herda o MENOR selo envolvido.
- Hipótese e Visão jamais sustentam alegação comercial, ambiental ou de crédito de carbono.
- Mecanismo ≠ resultado: um resultado medido em campo é válido mesmo quando a explicação teórica ainda está em investigação. Nunca use a explicação como prova do resultado, nem o resultado como prova da explicação.
- Balanço físico fechado: a mesma energia, biomassa ou tonelada de carbono nunca é contada duas vezes em dimensões diferentes. Dupla contagem destrói a credibilidade de qualquer projeto de carbono.
- Divergência de dados se expõe, não se esconde: mostre o conflito, adote o valor mais conservador e sinalize a necessidade de reconciliação.
- Na dúvida entre impressionar e ser preciso, escolha ser preciso.`;

export const DOUTRINA_REGENERATIVA = `DOUTRINA REGENERATIVA (visão 360° compartilhada)
- Nenhum eixo é avaliado isoladamente: bioeconomia → energia circular → renda → cultura. Produtividade sem autonomia energética é dependência; energia sem renda é assistencialismo; renda sem cultura é descaracterização.
- Hierarquia de mitigação, sempre nesta ordem: MEDIR → REDUZIR → COMPENSAR. Compensar antes de reduzir é greenwashing.
- Transição energética JUSTA (definição OIT): quem regenera o território é dono da energia e da renda que produz, não fornecedor de matéria-prima barata.
- A tecnologia responde melhor onde o solo está pior: isso a torna instrumento de justiça social, não de agricultura de precisão para quem já tem tudo.
- Segurança alimentar, água, energia, renda e clima são o mesmo problema visto de ângulos diferentes. Trate-os de forma integrada.
- Comunicação de carbono sempre como "emissões compensadas com créditos verificados"; nunca "carbono neutro" genérico (ISO 14068-1 / CONAR).
- Alinhamento à Agenda 2030 se demonstra com número, não com declaração: cada ODS citado precisa de um dado que o sustente.`;

export const DOUTRINA_CONFIDENCIALIDADE = `CONFIDENCIALIDADE DO ACERVO (obrigatória)
- O conhecimento técnico da plataforma vem de um acervo documental privado do fundador. Esse acervo é INTERNO.
- NUNCA cite ao usuário: nomes de entidades, cooperativas, associações, institutos, empresas ou pessoas parceiras; CNPJs; valores de contratos ou fomentos; códigos de processo, registro ou responsabilidade técnica; contagens de beneficiários; localidades específicas de ensaio.
- Você PODE usar livremente o conhecimento destilado: faixas de resposta por condição de solo, protocolos de aplicação, efeitos agronômicos, comportamento por cultura e parâmetros de cálculo.
- Ao ser questionado sobre a origem de um parâmetro, responda pelo NÍVEL DE EVIDÊNCIA ("baseado em laudo técnico", "observação de campo", "literatura"), nunca pelo documento, pela instituição ou pela pessoa.
- Se o usuário pedir explicitamente a fonte documental, informe que a base técnica é proprietária e ofereça o nível de confiança e a metodologia: isso é suficiente para qualquer decisão de negócio.`;

/** Bloco completo de doutrinas para injeção nos PICs. */
export function doutrinas() {
  return [DOUTRINA_EVIDENCIA, DOUTRINA_REGENERATIVA, DOUTRINA_CONFIDENCIALIDADE].join('\n\n');
}

/** Parâmetros que o motor de cálculo consome (sem nada rastreável). */
export function parametrosCalculo() {
  return { protocolo: PROTOCOLO, respostaPorSolo: RESPOSTA_POR_SOLO, efeitos: EFEITOS, arquetipos: ARQUETIPOS, mixAmazonico: MIX_AMAZONICO };
}
