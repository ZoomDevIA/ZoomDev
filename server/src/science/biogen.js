// ═══════════════════════════════════════════════════════════════════════════
// BIOGEN — o ativo digital regenerativo da tecnologia Biogenesis COT
// (unifica o conceito antes chamado "Token Coin Max / CMX": é a MESMA
//  tecnologia Biogenesis, agora com um design de token lastreado e auditável).
//
// PRINCÍPIO INEGOCIÁVEL: BIOGEN não é promessa nem especulação. Cada unidade é
// lastreada em impacto REAL, VERIFICADO e APOSENTADO em registro público. É a
// antítese do "carbono de papel" e de tokens sem lastro.
//
// Este módulo descreve o CONCEITO e a governança. Não emite token nem capta
// recursos — emissão real depende das travas de compliance abaixo.
// ═══════════════════════════════════════════════════════════════════════════

export const BIOGEN = {
  nome: 'BIOGEN',
  simbolo: 'BGN',
  subtitulo: 'O ativo digital da regeneração planetária',
  tecnologia: 'Biogenesis COT BioTechnology',
  principio: '1 BIOGEN = 1 tonelada de CO₂ equivalente, mitigada por impacto verificado e aposentada em registro público, com serial rastreável.',

  // ── Lastro em camadas: nenhuma unidade nasce sem evidência ────────────────
  lastro: [
    {
      camada: 'Carbono verificado',
      descricao: 'Sequestro ou emissão evitada, medida por MRV instrumentado e verificada por terceira parte acreditada (VCS/Verra, Gold Standard ou padrão equivalente).',
      exigeMRV: true, selo: 'VERIFICADO',
    },
    {
      camada: 'Biomassa regenerada',
      descricao: 'Ganho de biomassa e recuperação de solo documentados em laudo técnico assinado, com testemunha pareada.',
      exigeMRV: false, selo: 'LAUDO',
    },
    {
      camada: 'Energia limpa gerada',
      descricao: 'Energia de biodigestão comunitária medida em planta instalada (kWh com medidor), substituindo fóssil.',
      exigeMRV: true, selo: 'VERIFICADO',
    },
  ],

  // ── Ciclo de vida de 1 BIOGEN ─────────────────────────────────────────────
  ciclo: [
    { etapa: 1, nome: 'Aplicação', desc: 'Biogenesis COT aplicado em campo com responsável técnico (ART).' },
    { etapa: 2, nome: 'Mensuração (MRV)', desc: 'Medição instrumentada de biomassa, solo, água e energia — sensores, imagens de satélite e laudos.' },
    { etapa: 3, nome: 'Verificação', desc: 'Auditoria por terceira parte acreditada e independente do fabricante (ex.: monitoramento IFAP + certificadora).' },
    { etapa: 4, nome: 'Emissão', desc: 'Crédito emitido em registro público reconhecido; 1 crédito = 1 BIOGEN cunhado, com serial vinculado.' },
    { etapa: 5, nome: 'Aposentadoria', desc: 'O crédito é aposentado (retirement) no registro no ato da cunhagem — impossível dupla contagem.' },
    { etapa: 6, nome: 'Transparência', desc: 'Serial, laudo, geolocalização e hash on-chain públicos. Qualquer pessoa audita a origem.' },
  ],

  // ── Anti-greenwashing e anti-dupla-contagem ───────────────────────────────
  integridade: [
    'Aposentadoria no ato da emissão: o crédito que lastreia um BIOGEN nunca é vendido separadamente.',
    'Um serial de registro público por token — rastreável e imutável.',
    'Adicionalidade e permanência avaliadas antes da emissão; buffer de reversão para projetos de base natural.',
    'Comunicação sempre como "impacto verificado e compensado", nunca "carbono neutro" genérico (ISO 14068-1 / CONAR).',
    'Mecanismo científico do insumo tratado como hipótese em investigação — jamais como lastro do token.',
  ],

  // ── Governança e compliance (TRAVA para emissão real) ─────────────────────
  compliance: {
    status: 'CONCEITO — não emitido',
    travas: [
      'Enquadramento regulatório prévio: um token que promete retorno financeiro tende a ser valor mobiliário sob a CVM. Emissão só após parecer jurídico e, se aplicável, registro/dispensa na CVM.',
      'Prestador de Serviços de Ativos Virtuais conforme a Lei 14.478/2022 (Marco Legal das Criptomoedas) e regulamentação do Banco Central.',
      'Padrão de carbono reconhecido (ICVCM Core Carbon Principles) e verificação independente antes de qualquer cunhagem.',
      'KYC/AML e prevenção à lavagem de dinheiro nas transações.',
      'Auditoria de contrato inteligente por terceira parte antes de qualquer deploy on-chain.',
    ],
    principioFundador: 'Preferimos lançar tarde e íntegro a lançar cedo e frágil. A credibilidade é o único lastro que não se pode cunhar.',
  },

  // ── Utilidade dentro do ecossistema ZoomDev ───────────────────────────────
  utilidade: [
    'Compensar o passivo ambiental calculado no CarbonPay com lastro rastreável.',
    'Financiar aplicações de Biogenesis em novas comunidades (cada aplicação verificada gera novos BIOGEN).',
    'Remunerar cooperativas e agricultores familiares pela regeneração que produzem — renda por serviço ambiental.',
    'Dar aos investidores exposição a impacto real, auditável, alinhado a ODS e à agenda climática da ONU.',
  ],
};

/**
 * Estima quantos BIOGEN um cenário de impacto PODERIA lastrear — sempre no
 * modo conceitual, deixando explícito o que falta para a emissão real.
 */
export function potencialBiogen({ co2eSequestradoTonAno = 0, co2eEvitadoTonAno = 0 }) {
  const elegivelBruto = Math.max(0, Number(co2eSequestradoTonAno) || 0) + Math.max(0, Number(co2eEvitadoTonAno) || 0);
  // Buffer de reversão de 20% (permanência) descontado antes de qualquer emissão
  const aposBuffer = elegivelBruto * 0.8;
  return {
    co2eElegivelTon: Math.round(elegivelBruto * 100) / 100,
    biogenPotencial: Math.round(aposBuffer * 100) / 100,
    bufferReversaoPercentual: 20,
    condicao: 'Potencial teórico. Nenhum BIOGEN é emitido sem MRV instrumentado, verificação por terceira parte, aposentadoria em registro público e as travas de compliance CVM/BCB.',
    status: BIOGEN.compliance.status,
  };
}
