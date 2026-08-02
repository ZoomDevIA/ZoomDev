# ZoomDev OS: Design System (clone fiel do protótipo Base44)

> Fonte: extração direta do CSS/JS de produção de `https://zoom-dev-os.base44.app/` (ago/2026),
> screenshots das telas públicas e screenshots internos do Plano de Negócios.

## 1. Identidade

- **Nome:** ZoomDev OS
- **Tagline:** "IDEA TO EXIT" / "Construa o futuro. Com IA. Com propósito."
- **Logo:** "Z" estilizado em duas ondas: onda superior em gradiente verde, inferior em gradiente azul
- **Tom:** futurista-orgânico ("floresta digital"): circuitos + folhas, glassmorphism escuro, neon verde
- **Copy:** pt-BR, direto, com emojis pontuais ("Bem-vindo(a) de volta! 👋", "Crie sua conta 🚀")

## 2. Tokens de cor (valores exatos do CSS de produção)

```css
:root {
  --brand-green: #00ff64;   /* verde neon, cor primária */
  --brand-blue:  #00c8ff;   /* ciano, cor secundária */
  --brand-bg:    #030d07;   /* fundo global (verde-preto) */
}
```

| Uso | Valor |
|---|---|
| Fundo global | `#030d07` |
| Sidebar | `linear-gradient(180deg, #050f08, #040c07)` + borda direita `rgba(0,255,100,.08)` |
| Card padrão | fundo `#05140acc`, borda `rgba(0,255,100,.12)`, `backdrop-filter: blur(12px)` |
| Card glow | fundo `#05140ae6`, borda `rgba(0,255,100,.2)`, blur 16px, `box-shadow: 0 0 20px #00ff640d, inset 0 1px #00ff641a` |
| Verde dim (texto secundário verde) | `#00cc50` |
| Texto primário | `#ffffff` / `rgba(255,255,255,.7)` corpo / `.4–.5` auxiliar |
| Gradiente CTA/botão | `linear-gradient(135deg, #00ff64 0%, #00c8ff 100%)`, texto `#030d07`, peso 700 |
| Gradiente CTA hover | `linear-gradient(135deg, #00ff80, #00d460)` |
| Gradiente texto (headline) | mesmo 135deg verde→ciano com `background-clip: text` |
| Barra/linha decorativa | `linear-gradient(90deg, #00ff64, #00c8ff)` |
| Erro | vermelho suave sobre fundo `rgba(255,0,0,~.08)` com borda vermelha (padrão shadcn `--destructive: 0 84.2% 60.2%`) |

## 3. Tipografia

```css
--font-heading: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
--font-body:    "Inter", ui-sans-serif, system-ui, sans-serif;
--font-display: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
--font-mono:    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
```

- Títulos/display: **Space Grotesk** (peso 500–700)
- Corpo/UI: **Inter**
- Tags/labels: uppercase, 10px, peso 600, `letter-spacing: .05em`

## 4. Componentes com assinatura visual (classes `zd-*` do protótipo)

```css
.zd-bg           { background: var(--brand-bg); }
.zd-sidebar      { background: linear-gradient(180deg,#050f08,#040c07); border-right: 1px solid rgba(0,255,100,.08); }
.zd-card         { background: #05140acc; border: 1px solid rgba(0,255,100,.12); backdrop-filter: blur(12px); }
.zd-card-glow    { background: #05140ae6; border: 1px solid rgba(0,255,100,.2); backdrop-filter: blur(16px);
                   box-shadow: 0 0 20px #00ff640d, inset 0 1px #00ff641a; }
.zd-gradient-text{ background: linear-gradient(135deg,var(--brand-green) 0%,var(--brand-blue) 100%);
                   -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.zd-gradient-btn { background: linear-gradient(135deg,var(--brand-green) 0%,var(--brand-blue) 100%);
                   color: var(--brand-bg); font-weight: 700; }
.zd-menu-item        { color: #ffffff80; transition: all .2s ease; }
.zd-menu-item:hover  { color: #ffffffe6; background: #00ff640f; }
.zd-menu-item.active { color: #00ff64; background: #00ff641a; border-right: 2px solid #00ff64; }
.zd-stat-card        { background: #00ff640a; border: 1px solid rgba(0,255,100,.1); transition: all .3s ease; }
.zd-stat-card:hover  { border-color: #00ff6440; background: #00ff6412; }
.zd-agent-card       { background: #05140ae6; border: 1px solid rgba(0,255,100,.15); transition: all .3s ease; cursor: pointer; }
.zd-agent-card:hover { border-color: #00ff6466; transform: translateY(-2px); box-shadow: 0 8px 25px #00ff641a; }
.zd-glow-green   { box-shadow: 0 0 30px #00ff6426; }
.zd-glow-blue    { box-shadow: 0 0 30px #00c8ff26; }
.zd-circuit-bg   { background-image: radial-gradient(circle at 20% 50%, rgba(0,255,100,.03) 0%, transparent 50%),
                                     radial-gradient(circle at 80% 20%, rgba(0,200,255,.03) 0%, transparent 50%); }
.zd-notification { background: #05140af2; border: 1px solid rgba(0,255,100,.15); border-left: 3px solid #00ff64; }
.zd-tag          { background: #00ff641a; border: 1px solid rgba(0,255,100,.2); color: #00ff64;
                   font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; }
.zd-pulse        { animation: zdPulse 2s ease-in-out infinite; }
.zd-float        { animation: zdFloat 4s ease-in-out infinite; }
.zd-spin-slow    { animation: spin 20s linear infinite; }
```

Animações: `zdPulse` (pulso de glow), `zdFloat` (flutuação suave), `spin` lento (20s), mais os
padrões shadcn (`accordion-up/down`, `enter/exit`, `ping`, `pulse`).

## 5. Stack visual de referência

- **React + Vite + Tailwind CSS + shadcn/ui** (variáveis `--background/--card/--primary/...` em HSL + `--radius: .5rem`)
- Sidebar shadcn com tokens `--sidebar-*`
- Ícones: Lucide (estilo linear, traço fino)
- Layout: sidebar fixa escura à esquerda, conteúdo com cards translúcidos, CTAs em gradiente,
  cantos levemente arredondados (`.5rem` base, cards maiores `rounded-xl/2xl`)

## 6. Padrões de tela (referência das capturas)

- **Login/Registro:** split, hero à esquerda (headline com palavra destacada em verde + 3 mini-cards
  de features + card de vídeo), card de auth à direita com tabs Entrar/Criar conta em pílula gradiente,
  social login (Google, GitHub, Microsoft, Apple, Biometria), microcopy de segurança no rodapé
- **Dashboard:** saudação personalizada, 4 stat-cards (Projetos Ativos, Ideias Criadas, MVPs, Score de
  Impacto), jornada em 5 etapas (Ideação → Validação → MVP → Tração → Escala), lista de projetos
- **Builder:** chat do agente à esquerda, abas Pré-visualização / Painel / Código à direita, live preview
- **Onboarding:** tour guiado com tooltips passo-a-passo
- **Checkout:** Stripe embutido (planos PRO / BUSINESS)
