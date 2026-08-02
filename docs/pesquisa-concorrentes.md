# Pesquisa de Concorrentes: Base44, Lovable, Abacus.AI

> Pesquisa realizada em ago/2026 (fontes citadas inline). Foco: onde cada plataforma
> peca em **interoperabilidade** e **experiência do usuário**, e o que a ZoomDev
> deve fazer de diferente.

## 1. Base44 (base44.com: adquirida pela Wix por ~US$ 80 mi, jun/2025)

**O que é:** vibe coding "all-in-one": Postgres gerenciado, auth, storage, hosting, e-mail e
funções de backend embutidos. Dois tipos de crédito (mensagem + integração), planos de US$ 0 a
US$ 200/mês, sem rollover.

**Onde peca, interoperabilidade:**
- Export de código traz **só o frontend**: banco, dados, usuários, auth, storage e automações ficam
  presos nos servidores da Base44; o código exportado apenas chama as APIs proprietárias
  (existe até um site dedicado à fuga: escapebase44.com).
- GitHub sync só em plano pago (Builder+), **conexão irreversível**, apenas branch `main`,
  schemas de entidades ficam fora do repo.
- Sem backend externo: integração com Supabase é o pedido nº 1 do fórum oficial de feedback.
- Domínio próprio e remoção de branding só em planos pagos.

**Onde peca, UX (reclamações reais):**
- Trustpilot 3,1/5: cobranças sem autorização, cancelamento difícil, política sem reembolso.
- Loops de erro que queimam créditos: IA responde "corrigido" sem mudar nada; caso relatado de
  16.384 créditos de integração consumidos em minutos por bug da própria IA (reembolso parcial).
- Free plan agressivo (25 msgs/mês) e créditos cobrados por erros da própria IA.
- Suporte sem chat ao vivo, respostas lentas.

**Gamificação:** leve e periférica, referral (10 créditos/amigo), share-to-earn (20 créditos por
post social), 5 créditos diários no free. Sem XP, badges, streaks ou ranking no produto.

## 2. Lovable (lovable.dev: líder da categoria, ~US$ 400M ARR em mar/2026)

**O que é:** text-to-app React + Tailwind + Vite com backend Supabase/"Lovable Cloud".
Planos: Free (5 créditos/dia), Pro US$ 25, Business US$ 50, Enterprise.

**Onde peca, interoperabilidade:**
- **Lock-in do Lovable Cloud**: até jul/2026 não havia export oficial do backend gerenciado
  (dados/auth/storage presos): a comunidade mantinha guias de migração de 33 passos.
- Stack travada (React/Tailwind/Vite + Supabase apenas), sem importar codebase existente,
  sem mobile nativo.
- GitHub sync bidirecional existe (ponto forte), mas edições manuais externas confundem a IA.
- Domínio próprio só em plano pago; limite de 1.000 req/min por conector.

**Onde peca, UX (reclamações reais):**
- Thread oficial de feedback: "Credits waste due to agent going into error loops": mês inteiro
  de créditos consumido em horas; suporte respondeu com IA sugerindo "melhorar prompts".
- Era "Lovable 2.0": pedidos triviais quebravam partes não relacionadas do app; IA perdia
  contexto e repropunha o mesmo plano em loop.
- Consenso de reviews: excelente para protótipo, problemático além dele (produção/apps complexos).
- Trustpilot: dificuldade para remover cartão vinculado; cobranças indevidas.

**Gamificação:** comunitária, não in-product, galeria "Lovable Launched" com upvotes que rendem
créditos, créditos diários (mecânica de daily reward), hackathons mundiais com prêmios.
Sem XP/níveis/conquistas no produto.

## 3. Abacus.AI (ChatLLM / DeepAgent / AppLLM / CodeLLM)

**O que é:** "AI Super Assistant" multi-modelo (100+ LLMs) + DeepAgent (agente autônomo que
constrói e deploya apps) + AppLLM (builder no-code). Basic US$ 10, Pro US$ 20, Enterprise custom.

**Onde peca, interoperabilidade:**
- **Export de código do app gerado não documentado**; hosting, banco e auth presos ao ecossistema.
- Não importa codebase existente ("não aceita zips grandes nem projetos pré-existentes").
- API completa só no tier Enterprise.
- Relato de que não é possível remover dados de pagamento sem deletar a conta.

**Onde peca, UX (reclamações reais):**
- Trustpilot 3,6/5 (ChatLLM 1,9/5): "DeepAgent gastou 18k créditos em menos de 40 minutos";
  créditos opacos ("credits are not tokens", sem tabela pública de consumo).
- **Regra dos 75%**: um quarto dos créditos mensais fica travado até a última semana do ciclo:
  usuários descobrem o lockout sem aviso.
- Tarefas que "travam ou falham no meio, continuando a consumir créditos".
- UI confusa/"labirinto", suporte que "para de responder quando se pede reembolso",
  cobranças após cancelamento.

**Gamificação:** inexistente no produto (apenas referral monetário em camadas).

## 4. Síntese: o espaço que a ZoomDev ocupa

| Dor comum do mercado | Oportunidade ZoomDev |
|---|---|
| Lock-in (export parcial ou inexistente) | **Ejeção total em 1 clique**: repo GitHub completo (front + back + schema + seeds + IaC) desde o plano free:"seu código é seu" como valor de marca |
| Créditos opacos + queimados em loops de erro | **Economia de créditos transparente**: custo estimado antes de cada ação, medidor em tempo real, **estorno automático quando a IA falha** (QA-gate: só cobra o que passou na validação) |
| IA que quebra o que já funcionava | Checkpoints/rollback gratuitos + agente de QA que valida build/testes antes de entregar |
| Billing hostil (cancelamento difícil, sem reembolso) | Cancelamento self-service em 1 clique, política de reembolso clara: confiança como diferencial |
| Suporte robótico | Suporte humano + comunidade ativa (já previsto no pitch como "pós-venda completo") |
| Gamificação ausente ou periférica em TODOS os três | **Filosofia gamificada completa e nativa** (ver `gamificacao.md`): nenhum concorrente tem isso; é o diferencial de retenção da ZoomDev |
| Nenhum foco em impacto/bioeconomia | Trilha Bio + editais + carbono já são exclusivos da ZoomDev |
