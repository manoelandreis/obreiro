## Objetivo

No mobile, transformar os dois dropdowns da lista de orçamentos ("Ações" e "Partilhar") num bottom sheet full-width que sobe de baixo, mantendo o comportamento atual de dropdown em tablet/desktop.

## Mudanças

**`src/pages/app/AppQuotes.tsx`**

1. Adicionar hook para detectar mobile (`useIsMobile` de `@/hooks/use-mobile`, já existente no projeto).
2. Adicionar estado `sheetQuote: { quote, kind: 'actions' | 'share' } | null`.
3. No mobile:
   - Os botões "Ações" e "Partilhar" deixam de ser `DropdownMenuTrigger` e passam a abrir o bottom sheet via `setSheetQuote(...)`.
   - Renderizar um único `Sheet` (shadcn, `side="bottom"`) no fundo da página com o conteúdo dinâmico consoante `kind`:
     - **Ações**: lista vertical grande com Editar, separador "Mudar estado" + 6 opções de status (com check no atual), separador, Eliminar (vermelho).
     - **Partilhar**: Enviar por email, WhatsApp, Copiar link.
   - Itens são botões altos (`h-14`, `text-base`, ícone à esquerda) para toque confortável.
   - Sheet com `rounded-t-2xl`, padding generoso, título no topo (ex.: "Ações" / "Partilhar") e handle visual.
4. No tablet/desktop (`!isMobile`): manter exatamente os `DropdownMenu` atuais.

Sem mudanças de lógica de negócio — apenas apresentação. Mesmas funções `updateStatus`, `handleDelete`, `shareEmail`, `shareWhatsapp`, `copyLink`.

## Componentes usados

- `@/components/ui/sheet` (já existe no shadcn setup)
- `@/hooks/use-mobile`
