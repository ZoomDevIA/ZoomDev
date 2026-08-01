# Mercado de Créditos de Carbono — pesquisa e fundamentos da Calculadora ZoomDev

> Pesquisa realizada em ago/2026 (fontes citadas inline). Base da calculadora de passivo
> ambiental (`server/src/services/carbon.js`) e do módulo CarbonPay.

## 1. Panorama do mercado

- **Mercado voluntário (VCM):** ~US$ 535 mi transacionados em 2024 (preço médio ponderado
  US$ 6,34/t — Ecosystem Marketplace SOVCM 2025). Projeções MSCI: US$ 7–35 bi até 2030.
- **Mercado regulado brasileiro (SBCE):** Lei 15.042/2024 sancionada em dez/2024 cria o
  cap-and-trade nacional em 5 fases até ~2030. Em 2026 está na fase de regulamentação
  infralegal (Secretaria Extraordinária do Mercado de Carbono, Fazenda; meta de arcabouço
  completo até dez/2026). Obrigações: >10.000 tCO2e/ano relata; >25.000 tCO2e/ano entra no
  teto com entrega de CBE/CRVE; multa até 3% do faturamento. **PMEs/startups típicas ficam
  fora do regulado — o mercado da ZoomDev é o voluntário.**
- **COP30 (Belém):** destravou o Art. 6.4 (PACM), avançou o 6.2 (ITMOs) e encerrou o CDM até
  fim de 2026. O SBCE foi desenhado para interoperar com o Art. 6 — tendência de valorização
  dos créditos brasileiros.

## 2. Padrões, registros e o que é preciso para REVENDER créditos

| Padrão | Perfil |
|---|---|
| Verra (VCS) | Maior registro do VCM; VCUs com serial público, aposentadoria rastreável |
| Gold Standard | Foco em co-benefícios (ODS); registro público próprio |
| CERCARBONO | Ágil/barato, ativo no Brasil (atenção à due diligence) |
| ART/TREES | REDD+ jurisdicional (Acre, MT, AM; LEAF Coalition) |
| Social Carbon | Origem brasileira, selo de co-benefícios sociais |

**Fluxo legítimo de revenda dentro do SaaS:**
1. Conta corporativa no registro (com KYC) **ou** parceiro/API com conta (Patch, Cloverly, Moss);
2. Compra dos créditos (marketplace B2B, broker OTC 5–20%, ou direto de desenvolvedores
   amazônicos — Moss, Carbonext, Biofílica/Ambipar — com margem melhor e mais due diligence);
3. **Aposentadoria (retirement) em nome do cliente** — gera registro público com serial,
   projeto, vintage, beneficiário e data;
4. Certificado com link para o registro público — a única prova aceitável de compensação.
   Microcompensações são agregadas até fechar 1 t antes do retirement.

**Regulatório BR:** crédito fora de bolsa é ativo negociável sem licença específica hoje;
vira valor mobiliário (CVM) apenas se securitizado/negociado em mercado financeiro.
A Lei 15.042 permite deduzir do IRPJ/CSLL despesas de emissão/registro/certificação.

## 3. Preços de referência 2025–2026 (base da tabela CarbonPay)

| Tipo de projeto | USD/tCO2e | BRL/tCO2e (~5,4) |
|---|---|---|
| REDD+ média de mercado | 2,70–6 | 15–32 |
| REDD+ alta qualidade (rating/CCP) | 10–15+ | 55–190 |
| ARR/restauração | 15–35 | 80–190 |
| Energia renovável (legado) | 1–4 | 5–22 |
| Cookstoves | 4–10 | 22–55 |
| Biochar | 165–177 | 890–960 |
| Remoções tecnológicas (DAC) | 150–500+ | 800–2.700+ |

Os projetos demo do CarbonPay usam: REDD+ alta qualidade R$ 89/t, ARR R$ 132/t,
cookstoves R$ 38/t — dentro das faixas acima.

## 4. Metodologia da calculadora (GHG Protocol)

- **Escopo 1** (combustão direta): gasolina ~2,2 kgCO2e/l e diesel ~2,6 kgCO2e/l (ajustados
  à mistura obrigatória etanol/biodiesel — Programa Brasileiro GHG Protocol/FGVces).
- **Escopo 2** (eletricidade): fator médio anual do SIN **0,0385 tCO2/MWh (MCTI/SIRENE 2023)**
  — grid brasileiro ~10x mais limpo que a média global. Atualizar anualmente pela série
  MCTI/SIRENE (2024 subiu por despacho térmico).
- **Escopo 3** (cadeia): voos por hora (DEFRA/ICAO), frete por t·km, commuting/escritório por
  colaborador e nuvem por gasto (spend-based) — em serviços/SaaS o Escopo 3 costuma ser
  70–90% da pegada.
- **Escada de qualidade:** atividade > dado do fornecedor > gasto. A calculadora ZoomDev é
  **triagem** (activity + spend simplificados); inventário oficial → ferramenta do Programa
  Brasileiro GHG Protocol (FGVces) e Registro Público de Emissões.
- **Margem de compensação:** +20% sobre o total estimado (incerteza de triagem).

**Referências de UX estudadas:** Moss (B2C/B2B), Wren, Cloverly e Patch (API por evento),
SOS Mata Atlântica. Boas práticas aplicadas: poucos inputs com exemplos, campos opcionais
("comece só com conta de luz + combustível"), resultado com equivalências concretas (voos
SP–NY, árvores, km de carro), transparência dos fatores e CTA de compensação em BRL.

## 5. Anti-greenwashing (obrigatório na comunicação)

- **CONAR (Anexo U, out/2025):** claims ambientais exigem veracidade, comprovação e
  concretude — especificar período, escopo, volumes e tipo de crédito.
- **ABNT NBR ISO 14068-1:** neutralidade exige priorizar REDUÇÃO; compensar só o residual.
- Regras adotadas pela ZoomDev: dizer **"emissões compensadas com créditos verificados"**
  (nunca "carbono neutro" genérico), certificado de aposentadoria público por cliente,
  página do projeto com padrão/vintage/serial, e due diligence fundiária de projetos REDD+
  (histórico de sobreposições com terras públicas/indígenas na Amazônia).

## 6. Modelo de negócio da compensação no SaaS

- Comissão de intermediação típica do mercado: 5–20% (média ~15,5%); revenda B2C pratica
  markup de 20–40%. **Alvo ZoomDev: 15–30% com transparência da margem** (diferencial).
- Integração recomendada para produção: API de retirement (Patch/Cloverly) para
  time-to-market, evoluindo para conta própria em registro (margem maior).
- PIX como meio de pagamento (o protótipo Base44 já previa gateway PIX no CarbonPay).
