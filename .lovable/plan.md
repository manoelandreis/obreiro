# Formato de pagamento por defeito — múltiplos modelos personalizados

Reformular o card "Formato de pagamento por defeito" em `AppBrand.tsx` para suportar vários modelos personalizados nomeados, com vista colapsada por defeito, edição explícita e melhorias visuais na pré-visualização.

## 1. Modelo de dados

Estender `src/lib/paymentTerms.ts`:
- Adicionar tipo `CustomPaymentTemplate = { id: string; name: string; installments: PaymentInstallment[] }`.
- Função utilitária para criar template novo com `crypto.randomUUID()`.

Persistência (Lovable Cloud / `app_user_settings`):
- Nova coluna `payment_term_templates jsonb` (array de `CustomPaymentTemplate`). Migration com GRANTs (a tabela já tem RLS).
- Manter `default_payment_terms` como está (PaymentTerms ativo aplicado a novos orçamentos) — sem mudanças em `AppQuoteNew`, `AppQuotePreview`, `AppQuoteDetail`.
- Ao gravar: persistir ambos. Se o preset selecionado for um template personalizado, `default_payment_terms` recebe `{ preset: 'custom', installments: <do template> }`.

## 2. UX do card (apenas frontend / `AppBrand.tsx`)

Seletor "Modelo" passa a listar:
- Presets fixos (`100_end`, `50_50`, `30_70`, `30d`).
- Separador.
- Templates personalizados do utilizador (pelo `name`).
- Item final "+ Novo modelo personalizado" → cria template em branco, entra em modo edição.

Comportamento ao selecionar:
- Preset fixo → só mostra pré-visualização (sem form, sem editar/eliminar).
- Template personalizado → mostra, por defeito, **resumo colapsado** + dois botões: `Editar formato` (outline) e `Eliminar formato` (ghost destructive). O form de parcelas só aparece após clicar Editar; dentro do form há `Guardar alterações` e `Cancelar`.
- Eliminar abre `AlertDialog` de confirmação. Após confirmar, remove do array e seleciona o primeiro preset.

Criar novo:
- Campo `Nome do modelo` (Input) no topo do form de edição.
- Botão principal passa de "Guardar formato" para **"Adicionar formato"** quando estamos a criar um novo template; quando edição de existente, mostra "Guardar alterações".

## 3. Pré-visualização

- Mover data de exemplo para o título: `Pré-visualização (exemplo 1000,00 € — 18/06/2026)` (data de hoje formatada `pt-PT`).
- Reestruturar como grid de 3 colunas alinhadas (`grid grid-cols-[1fr_auto_auto]` com larguras fixas para datas e valores) para que "vence ..." e montantes fiquem alinhados em todas as linhas. Datas com largura fixa (ex.: `w-32 text-right`), valores `w-24 text-right`.

## 4. Ficheiros afetados

- `src/lib/paymentTerms.ts` — novos tipos + helper.
- `supabase/migrations/<timestamp>_payment_term_templates.sql` — `ALTER TABLE public.app_user_settings ADD COLUMN payment_term_templates jsonb;` (RLS já existe; GRANTs já existem na tabela).
- `src/pages/app/AppBrand.tsx` — refazer `paymentCard`: estado `templates`, `selectedKey`, `editingId`, lógica de criar/editar/eliminar, novo layout de pré-visualização.
- Sem alterações em `AppQuoteNew.tsx`, `AppQuotePreview.tsx`, `AppQuoteDetail.tsx` (continuam a ler `default_payment_terms`).

## 5. Validações

- Nome obrigatório e único entre templates.
- Soma das percentagens = 100% (mantém aviso atual).
- Confirmação obrigatória antes de eliminar.
