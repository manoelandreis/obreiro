# Galeria de Design System — acessível online, mas privada

## O que vai ser

Uma página nova em `/design-system`, acessível online (pré-visualização e site publicado), mas:

- **Sem qualquer link** na landing page, na app ou no admin — só quem souber o endereço lá chega.
- **Protegida por login de admin**: quem não tiver sessão de administrador é reencaminhado para o login do admin. Visitantes normais nunca veem nada.
- **Invisível para o Google**: marcada como não-indexável e excluída do mapa do site.

Assim não existe "galeria pública" — existe uma página interna só sua, que continua acessível de qualquer lado com a sua conta.

## O que a página mostra

Tudo, organizado por separadores:

1. **Cores** — todos os tokens (primary, accent, success, warning, info, destructive, brand-dark, muted, surfaces), com o nome do token, o valor e o nome equivalente em Figma.
2. **Tipografia** — Poppins (títulos) e Inter (corpo), com todos os tamanhos e pesos usados.
3. **Base** — raio de cantos, sombras, espaçamentos.
4. **Primitivos** — Button (todas as variantes e tamanhos), Input, Textarea, Label, Select, Checkbox, Badge, Card, Tabs, Accordion, Dialog/Drawer/Sheet (com botão para abrir), Table, Toast.
5. **Componentes da app** — `CollapsibleSection`, `SectionHeader`, `MobileSheetSelect`, `MobilePrimaryAction`, `QuoteStatusBadge`, `PaymentTermsCard`, `PasswordStrengthMeter`, `FeatureGate`.
6. **Secções do orçamento** — `ClientSection`, `ServicesSection`, `PaymentSection`, `NotesSection` com dados de exemplo, interativas.

Cada bloco mostra o **nome do componente em código e o nome correspondente em Figma**, para manter o 1:1.

Também um botão no topo para alternar entre tema claro e escuro, e ver a mesma página em largura de telemóvel.

## Pormenores técnicos

- Nova pasta `src/pages/design-system/` com `DesignSystem.tsx` (layout + separadores) e um ficheiro por secção (`ColorsPanel`, `TypographyPanel`, `PrimitivesPanel`, `AppComponentsPanel`, `QuoteSectionsPanel`).
- Componente auxiliar `ShowcaseItem` (nome em código, nome Figma, descrição, área de preview) reutilizado em todos os painéis.
- Rota `/design-system` registada em `src/App.tsx`, envolvida na mesma guarda de admin já usada em `/admin/*` (`useAuth` + `has_role`), com redirect para `/admin/login`.
- `<meta name="robots" content="noindex,nofollow">` injetada nessa página; `Disallow: /design-system` em `public/robots.txt`; não entra em `public/sitemap.xml`.
- Todos os previews usam apenas tokens de `src/index.css` — sem cores fixas.
- `docs/design-system.md` passa a referir a página como visualização viva do inventário.

## Alternativa: Storybook online (em vez da página acima)

É possível, com uma condição: o Lovable não consegue alojar o Storybook, por isso ele fica publicado num serviço externo.

- Instalo e configuro o Storybook no projeto, com uma "story" para cada componente e cada token listado acima (mesmo conteúdo da galeria).
- O projeto liga-se ao GitHub (Lovable já suporta isto) e o Storybook é publicado automaticamente no **Chromatic** (gratuito, feito pela equipa do Storybook) sempre que o código muda.
- No Chromatic o Storybook pode ficar **privado** — só entra quem convidar. Também permite ver diferenças visuais entre versões.
- O que precisa de fazer: ligar o projeto ao GitHub e criar uma conta Chromatic (5 minutos); eu deixo tudo o resto preparado.
- Desvantagem: não aparece dentro da pré-visualização do Lovable e adiciona ferramentas extra ao projeto.

Pode escolher: **página privada na app** (mais simples, sem contas externas) ou **Storybook no Chromatic** (ferramenta padrão da indústria, fora do Lovable).

## Verificação

- Build passa.
- Sem sessão de admin, `/design-system` redireciona para o login.
- Com sessão de admin, a página abre e todos os separadores renderizam sem erros (verificação com browser em 1280px e 390px).
