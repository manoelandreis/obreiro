
## Objetivo

Na secção **Formato de pagamento por defeito** (em `/app/brand`), substituir o dropdown atual por uma grelha de **cards selecionáveis** (estilo do wireframe), permitindo ao utilizador:

1. Escolher um dos presets standard com 1 clique.
2. Ver os seus próprios formatos personalizados guardados (com **nome**) como cards adicionais com etiqueta "Guardado por si".
3. Clicar em **"Criar personalizado"** para abrir o editor de parcelas atual + um novo campo **Nome do formato**.

## UI

**Grelha de cards** (responsive: 1 col mobile, 2 cols sm, 3 cols md):

Cada card mostra:
- Título (ex.: `100% à conclusão`, ou nome do personalizado com ícone ⭐)
- Barra(s) de progresso visual proporcional às parcelas (cores: accent para presets, primary para personalizados guardados — como no wireframe)
- Linhas de detalhe: `Adiantamento · 50%`, `Final · 50% a 30 dias`
- Card selecionado: borda destacada (`ring-2 ring-primary`)
- Personalizados guardados: badge "Guardado por si" no topo
- Card final tracejado: `+ Criar personalizado`

**Ao clicar "Criar personalizado":**
- Expande abaixo da grelha o editor de parcelas (Descrição / % / Dias) já existente
- Adiciona no topo um campo **Nome do formato** (ex.: "Meu 40/60")
- Botões: `Guardar formato` (persiste como novo card personalizado) e `Cancelar`

**Editar/Apagar personalizado:** ao passar o rato sobre um card personalizado, botão pequeno para editar/remover.

## Dados

Os custom presets nomeados precisam de persistência. Adicionar coluna `payment_term_presets jsonb` (array) em `app_user_settings`:

```ts
type SavedPaymentPreset = {
  id: string;            // uuid
  name: string;          // "Meu 40/60"
  installments: PaymentInstallment[];
};
```

O `payment_terms` atual continua a guardar o formato **selecionado por defeito** (snapshot das installments + um novo campo opcional `preset_id` para destacar o card correto).

## Alterações

1. **Migração** — adicionar `payment_term_presets jsonb default '[]'::jsonb` em `app_user_settings`.
2. **`src/lib/paymentTerms.ts`** — adicionar tipo `SavedPaymentPreset`; helper `presetSummary(installments)` para o texto curto do card.
3. **`src/components/app/PaymentPresetCard.tsx`** (novo) — card visual com barra proporcional, título, linhas de detalhe, estado selecionado, slot opcional para badge e ações hover.
4. **`src/pages/app/AppBrand.tsx`** — substituir o bloco do dropdown (linhas ~380–447) por:
   - Grelha de cards: presets standard + `payment_term_presets` do utilizador + card "Criar personalizado".
   - Editor de parcelas só visível em modo criação/edição, com campo **Nome do formato** no topo.
   - Carregar/guardar `payment_term_presets` no Supabase junto com `payment_terms`.
5. Manter a pré-visualização (€1000) e o botão `Guardar formato` (passa a guardar o preset selecionado como default).

Sem alterações na geração de orçamentos — continua a usar `payment_terms` (installments) do utilizador.
