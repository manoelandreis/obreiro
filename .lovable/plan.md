

# Admin Content — Sincronizar com a Landing Page

## Problema atual

O CMS admin mostra cartões genéricos (título/subtítulo/corpo) para 4 secções (hero, features, about, cta), mas a landing page tem mais secções (privacy strip, product snapshots, app coming soon) e cada secção usa campos diferentes. Não há contexto visual sobre onde cada secção aparece.

## O que vou fazer

Redesenhar o `AdminContent.tsx` para espelhar a estrutura real da landing page:

1. **Mapa visual das secções** — Mostrar uma barra lateral ou lista ordenada com todas as secções da landing page (incluindo as não editáveis), para o admin ver o contexto completo
2. **Campos específicos por secção** — Cada secção só mostra os campos que realmente usa na landing page:
   - **Hero**: título, subtítulo (sem corpo)
   - **Features**: título, subtítulo (sem corpo)
   - **About**: título, subtítulo, corpo
   - **CTA**: título, subtítulo (sem corpo)
3. **Preview inline** — Mostrar uma miniatura/descrição de como a secção aparece na página (ex: "Secção principal com título grande e botões de ação")
4. **Secções não editáveis** — Mostrar como cards desabilitados com etiqueta "Fixo no código" para: Navbar, Product Snapshots, Privacy Strip, App Em Breve, Footer
5. **Ordem visual** — Ordenar os cards exatamente como aparecem na página de cima para baixo

## Detalhes técnicos

- Definir um array `LANDING_SECTIONS` com metadata de cada secção (key, label, descrição, campos editáveis, editável sim/não)
- Mapear esse array com os dados do `landing_content` da base de dados
- Secções editáveis mostram inputs; secções fixas mostram apenas info
- Adicionar ícones e cores por secção para fácil identificação

## Ficheiros alterados

- `src/pages/admin/AdminContent.tsx` — Reescrita completa

