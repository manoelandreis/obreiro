# Revamp Visual — Handy Flow

Vamos fazer um redesign completo em **duas fases**: primeiro a **landing page** (esta resposta), depois o **/app** (resposta seguinte). Isto evita uma resposta gigante e permite-te validar a direcção da landing antes de propagar para o app.

---

## Direcção visual

Combinamos as duas referências:

- **Estrutura/layout** estilo Medusa.js → minimalista, muita whitespace, hero discreto, secções com mockups grandes "in-product", logos de confiança, tipografia contida.
- **Paleta + tom** do moodboard Handy Flow → Navy `#1B3A5C` como primária de confiança, Burnt Orange `#E8730A` como acento/CTAs, cinzas `#F5F5F5`/`#555` para superfícies e texto.
- **Tipografia** → Poppins (títulos) + Inter (corpo), substitui Space Grotesk.

---

## Fase 1 — Landing Page (`IndexV2`)

### 1. Design tokens (global, afecta tudo)

`src/index.css` + `tailwind.config.ts`:

- Trocar Space Grotesk por **Poppins** no `@import` e no `font-heading`.
- Reescrever variáveis HSL para a nova paleta:
  - `--background` → `#F5F5F5` (Light Grey)
  - `--foreground` → `#0F1B2A` (Ink)
  - `--primary` → `#1B3A5C` (Navy) — substitui o azul actual
  - `--accent` → `#E8730A` (Burnt Orange) — agora é cor protagonista
  - `--muted-foreground` → `#555555` (Slate)
  - `--border` → cinza muito subtil `#ECEEF0`
  - `--card` → branco puro
  - `--radius` → `0.875rem` (14px, como moodboard)
- Adicionar tokens novos: `--navy-deep`, `--orange-50` para highlights suaves.
- Sombras suaves `0 1px 2px rgba(15,27,42,.06), 0 8px 24px rgba(15,27,42,.06)`.

### 2. Reescrever `IndexV2.tsx` com layout Medusa-style

Estrutura nova (mantém o quote builder inline já existente, só muda visual):

```text
┌─────────────────────────────────────────────────┐
│  Navbar minimal (logo H + Handy Flow + nav)     │
├─────────────────────────────────────────────────┤
│  HERO — centrado, contido                       │
│  · eyebrow pill laranja "Para construtores PT"  │
│  · h1 grande Poppins ~56px                      │
│  · sub Inter cinza                              │
│  · 1 CTA navy + 1 ghost                         │
│  · barra de search/CTA inline (estilo Medusa)   │
├─────────────────────────────────────────────────┤
│  4 features inline (Browser/Workflows/...)      │
│  · ícone fino + label + desc 1 linha            │
├─────────────────────────────────────────────────┤
│  Mockup grande do produto (screenshot do app)   │
│  · cartão branco com sombra suave, vidro        │
├─────────────────────────────────────────────────┤
│  Logos de confiança / "construído em PT"        │
├─────────────────────────────────────────────────┤
│  Secção "Operações de orçamentação à escala"    │
│  · h2 + sub à direita                           │
│  · 2 cards grandes lado a lado com mockups      │
├─────────────────────────────────────────────────┤
│  Secção "10x menos tempo"                       │
│  · split: texto à esquerda, mockup à direita    │
├─────────────────────────────────────────────────┤
│  Secção "Sem comissões, sem GMV tax"            │
│  · 3 cards iguais com mini-charts/mockups       │
├─────────────────────────────────────────────────┤
│  Quote do utilizador (testemunho centrado)      │
├─────────────────────────────────────────────────┤
│  ═══ QUOTE BUILDER INLINE ═══ (já existe)       │
│  · re-skin com novos tokens, mais arejado       │
├─────────────────────────────────────────────────┤
│  CTA final + waitlist                           │
├─────────────────────────────────────────────────┤
│  Footer minimal (4 colunas links + subscribe)   │
└─────────────────────────────────────────────────┘
```

### 3. Princípios visuais

- **Whitespace generoso**: padding vertical 80–120px entre secções (vs 20px actual).
- **Container max 1180px**, conteúdo centrado.
- **Cards** com `border 1px solid #ECEEF0` + sombra muito subtil, sem gradients pesados.
- **CTAs**: primário Burnt Orange com sombra laranja, secundário Navy, ghost cinza.
- **Pills/badges**: cantos redondos completos, fundo `#FFF2E3` + texto laranja para eyebrows.
- **Iconografia**: lucide com `strokeWidth={1.5}` (mais fino, mais elegante).
- **Logos confiança**: tons cinza dessaturados, opacity 60%.

### 4. Componentes a actualizar

- `src/components/ui/button.tsx` → adicionar variantes `accent` (laranja) e ajustar `default` (navy).
- Sem mexer em shadcn por baixo, só estender.

### 5. Componentes da landing a substituir

- Remover `AppComingSoonSection` actual ou re-skin para o novo formato split.
- Re-skin do quote builder inline (mantém lógica, só muda classes).
- Footer novo (em vez do que existir).

### Ficheiros alterados na Fase 1

- `src/index.css` — paleta + fontes
- `tailwind.config.ts` — fonts (Poppins/Inter)
- `src/components/ui/button.tsx` — variante `accent`
- `src/pages/IndexV2.tsx` — reescrita visual completa (lógica do quote builder mantida)
- `src/components/AppComingSoonSection.tsx` — re-skin
- `src/pages/Quote.tsx` — pequeno ajuste de cores (para não desentoar)

---

## Fase 2 — App (`/app`) — **resposta seguinte**

Após validares a Fase 1, replicamos a linguagem em:

- `src/components/AppLayout.tsx` — sidebar com novo navy + acento laranja no item activo
- `src/pages/app/AppDashboard.tsx` — cards stats + chart com nova paleta
- `src/pages/app/AppJobs.tsx`, `AppClients.tsx`, `AppQuotes.tsx`, `AppQuoteNew.tsx`, `AppSettings.tsx` — re-skin uniforme
- `src/pages/app/AppLogin.tsx` + `AppSignup.tsx` — split-screen com lado navy de marca
- `src/components/AdminLayout.tsx` + páginas admin — alinhadas com nova paleta

---

## Notas técnicas

- Todas as cores via tokens semânticos HSL (sem hex hardcoded em componentes).
- Carregamos Poppins + Inter via `@import` no `index.css` (já temos esse padrão).
- O quote builder inline na landing **mantém toda a lógica e estado** — só re-skin.
- Não mexemos em DB nem em rotas.