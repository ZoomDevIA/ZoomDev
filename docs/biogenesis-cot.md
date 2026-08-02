# Biogenesis COT BioTechnology — dossiê técnico e Selo de Evidência

> Marca de plataforma: **Biogenesis COT BioTechnology**
> Identidade legal do insumo: **Fertilizante Organomineral Classe A — registro MAPA nº PR 002437-6.000006**
> Nome histórico nos laudos: *LOGOS*

Em contexto técnico e regulatório citamos **sempre o registro legal**. Marca de plataforma
não sobrescreve registro no MAPA — essa disciplina evita questionamento em auditoria.

---

## 1. Por que existe o Selo de Evidência

Uma plataforma que quer vender crédito de carbono e ser reconhecida pela ONU não pode
tratar todas as afirmações como iguais. Um laudo assinado e uma hipótese teórica têm pesos
diferentes — e misturá-los destrói a credibilidade dos dois.

O **Selo de Evidência ZoomDev** (`server/src/science/selos.js`) classifica cada alegação:

| Selo | Confiança | Uso comercial | Uso em crédito |
|---|---|---|---|
| 🏛️ **Verificado** | 100% | ✅ | ✅ |
| 🌱 **Laudo técnico** | 90% | ✅ | ✅ |
| 🌾 **Observação de campo** | 80% | ✅ | ❌ (falta MRV) |
| 📄 **Pesquisa** | 75% | ✅ | ✅ |
| 🎯 **Estratégia** | 60% | ✅ | ❌ |
| 💬 **Hipótese em investigação** | 50% | ❌ | ❌ |
| ✨ **Visão / Manifesto** | 10% | ❌ | ❌ |

**Regra do elo mais fraco:** numa cadeia de raciocínio, o resultado herda o menor selo.
Um cálculo que usa um dado de campo (80%) e um laudo (90%) vale **80%**.

---

## 2. Camada verificável — o fosso competitivo

| Evidência | Verificação | Selo |
|---|---|---|
| Registro MAPA, Organomineral Classe A | **PR 002437-6.000006** (Agro Serena Ltda) | 🏛️ 100% |
| Reconhecimento federal — PNDR/MIDR | **SEI 5205257 · CRC 83DFD260**, Nota Informativa nº 4 de 17/07/2024 | 🏛️ 100% |
| Responsabilidade técnica | **ART CREA-AP nº AP20240087759** — Eng. Agr. Marcelo I. P. Creão | 🏛️ 100% |
| Termo de Fomento (Lei 13.019/2014) | **R$ 3.798.400** · INCEMA × PESCAP-AP · 17.220 L | 🏛️ 100% |
| Monitoramento independente | IFAP, 13 cooperativas, 7 municípios (gov.br/MDR) | 🏛️ 100% |
| Produtividade ≥ 3× em solo ácido não corrigido | Laudo Mandioca — Fazenda Quilombo do Mel, Macapá/AP | 🌱 90% |
| Enraizamento ≥ 3× | Laudo Mandioca — coletas 120 dias após 2ª aplicação | 🌱 90% |
| Área foliar +30% | IT 036/24 — Agro Serena (Inajá e Mel da Pedreira) | 🌱 90% |
| Controle fitossanitário (resposta em 25 dias) | Laudo + IT 036/24 + campo (Oiapoque) | 🌱 90% |
| Solo seguro (organoclorados < LD) | Laudo TUXTU, método PRO-LAB-108-7.8.2-00 | 🌱 90% |
| Resiliência hídrica — 58 dias sem chuva | IT 036/24, Miranorte/TO (vídeo + depoimento) | 🌾 80% |

**Contexto obrigatório do "3×":** medido em cenário de **resgate agronômico** (solo pH 5,3,
V=18%, sem calagem, com estresse fitossanitário). **Não é extrapolável** como ganho universal
para lavouras já corrigidas e sadias. Por isso o sistema oferece três cenários.

---

## 3. Cenários de ganho — o sistema nunca assume o melhor caso

| Cenário | Uplift | Selo | Quando usar |
|---|---|---|---|
| **Conservador** (padrão) | +30% | 🌱 Laudo | Piso defensável, ancorado no ganho de área foliar |
| **Moderado** | +80% | 🌾 Campo | Solo em recuperação; exige MRV para crédito |
| **Resgate agronômico** | +200% (3×) | 🌱 Laudo | Apenas em degradação equivalente à do laudo |

---

## 4. Mecanismo × resultado — a separação que protege o projeto

O desenvolvedor propõe que neutrinos, por decaimento beta positivo em processo de fusão a
frio, catalisariam a quebra da cadeia de hidrogênio da água, umedecendo o solo "de dentro
para fora".

Classificação: **💬 Hipótese em investigação (50%)**.

A física estabelecida indica que neutrinos interagem apenas pela força fraca, sem efeito
químico mensurável em escala bioquímica. **Isso não invalida o produto** — os resultados de
campo são reais, documentados em laudo e assinados por responsável técnico. Efeitos de
bioestimulantes são amplamente explicados por matéria orgânica, micronutrientes, sinalização
hormonal e recuperação da biota do solo.

> **Decisão de arquitetura:** o resultado (90%) e o mecanismo (50%) vivem em camadas
> separadas. Comunicação comercial e cálculo de carbono usam **apenas** o resultado.
> A hipótese permanece registrada como agenda de pesquisa — nunca como argumento de venda.

Camada espiritual (F.Q.S.V.E.C / "O Verbo") é classificada como **✨ Visão (10%)** e vive no
Manifesto, fora de qualquer módulo técnico, de MRV ou de carbono.

---

## 5. Culturas parametrizadas

15 culturas com produtividade base (t/ha), razão resíduo:produto, densidade calórica e preço
de referência. Marcadas com ★ as prioritárias do Amapá: mandioca, banana, abacaxi, cacau,
cupuaçu e açaí.

## 6. Endpoints

```
GET  /api/impacto/biogenesis              dossiê completo, selos, cenários, culturas
GET  /api/impacto/biogenesis/comunicaveis só alegações liberadas para comunicação
GET  /api/carbon/biogenesis/opcoes        culturas e cenários para a calculadora
POST /api/carbon/biogenesis               sequestro adicional (ESTIMATIVA vs CRÉDITO)
```
