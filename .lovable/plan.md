## Onde está hoje (referências no app)

- **Dashboard** (`src/pages/app/AppDashboard.tsx`):
  - Cards: *Trabalhos ativos*, *Tarefas pendentes*, *Próximos eventos* → vamos remover **Tarefas pendentes** e **Próximos eventos**.
  - Painel direito *Atividade Semanal* (gráfico de barras) → será substituído por **Lembretes**.
  - *Trabalhos Recentes* → vira **Orçamentos Recentes** (mantemos o card, troca de fonte de dados).
- **Sidebar** (`src/components/AppLayout.tsx`): a entrada *Trabalhos* já foi escondida, sem outras menções a tarefas/eventos.
- **Criação de orçamento** (`src/pages/app/AppQuoteNew.tsx`): hoje só tem *Título*, *Cliente*, *Serviços*, *Notas*. Vamos adicionar **Formato de Pagamento** acima das notas.

## Mudanças no Dashboard

1. **Remover** os cards *Tarefas pendentes* e *Próximos eventos*, e a query a `app_job_tasks`.
2. **Novo card — "Faturado este mês"** (verde):
   - Soma de `app_quotes.total` onde `status = 'aceite'` e `responded_at` no mês corrente.
   - Mostra também total acumulado (todos os tempos) em texto pequeno por baixo.
3. **Novo card — "A receber este mês"** (laranja):
   - Soma das parcelas dos orçamentos `aceite` cuja data de vencimento cai no mês corrente, com base no novo campo `payment_terms` (ver secção abaixo).
4. **Card "Trabalhos ativos"** mantém-se, mas passa a contar **orçamentos em aberto** (status `rascunho`, `enviado`, `visto`) — coerente com o resto do dashboard. Label: *Orçamentos em aberto*.
5. **Orçamentos Recentes** (substitui *Trabalhos Recentes*):
   - 5 últimos de `app_quotes` ordenados por `created_at desc`.
   - Mostra título, nome do cliente (do `client_snapshot`), valor total formatado, badge de status (usa `QuoteStatusBadge`), data.
   - Link “Ver todos” → `/app/quotes`. Clique na linha → `/app/quotes/:id`.
6. **Lembretes** (substitui *Atividade Semanal*):
   - Lista derivada client-side a partir de `app_quotes`. Regras iniciais:
     - `status = 'enviado'` e `sent_at` há ≥ 7 dias e ≤ 30 dias → *"Orçamento «X» foi enviado há N dias sem resposta — envie uma mensagem ao cliente."*
     - `status = 'visto'` e `viewed_at` há ≥ 3 dias → *"Cliente abriu «X» há N dias mas ainda não respondeu — faça follow-up."*
     - `status = 'aceite'` e `responded_at` há ≥ 7 dias sem job em curso → *"«X» foi aceite — confirme datas e inicie o trabalho."*
     - `expires_at` nos próximos 5 dias e ainda não respondido → *"«X» expira em N dias."*
   - Cada item tem ação rápida: *Abrir orçamento* e (quando aplicável) *Reenviar email*.
   - Máx. 6 itens, ordenados por urgência.

## Mudanças no Orçamento (`AppQuoteNew.tsx` + schema + PDF)

1. **Schema**: migração que adiciona `payment_terms jsonb` a `app_quotes` (sem default). Estrutura:
   ```json
   {
     "preset": "100_end" | "50_50" | "30_70" | "30d" | "custom",
     "installments": [
       { "label": "Adiantamento", "percent": 50, "due_offset_days": 0 },
       { "label": "Final", "percent": 50, "due_offset_days": 30 }
     ]
   }
   ```
   - `due_offset_days` conta a partir de `responded_at` (ou `sent_at` se ainda não aceite). Soma das `percent` deve dar 100.
2. **UI** (acima das *Notas*, dentro de um card colapsável "Formato de Pagamento"):
   - Select de preset: *100% à conclusão* / *50% adiantamento + 50% final* / *30% adiantamento + 70% final* / *Pagamento a 30 dias* / *Personalizado*.
   - Preview das parcelas com valor calculado a partir do `total` e data prevista.
   - Em *Personalizado* mostra editor de linhas (label, %, dias após aceitação).
3. **PDF** (`src/lib/quotePdf.ts`): adiciona secção "Condições de Pagamento" antes das notas, com tabela das parcelas.
4. **Card "A receber este mês"** lê `payment_terms` + `responded_at`/`sent_at` para calcular vencimentos do mês corrente.

## Detalhes técnicos

- Toda a leitura no dashboard usa um único `select` em `app_quotes` filtrado por `user_id` (RLS já restringe) com colunas: `id, title, status, total, created_at, sent_at, viewed_at, responded_at, expires_at, payment_terms, client_snapshot`. Cálculos feitos em JS.
- Helper `monthRange()` para [`startOfMonth`, `endOfMonth`] em PT.
- Presets ficam num módulo `src/lib/paymentTerms.ts` com `expandInstallments(terms, total, anchorDate)` reutilizado por dashboard e PDF.
- Migração inclui `GRANT`s? Não — só `ALTER TABLE ADD COLUMN`, não cria tabela.
- Sem alterações em edge functions nesta fase.

## Arquivos a editar/criar

- `src/pages/app/AppDashboard.tsx` — reescrita parcial.
- `src/pages/app/AppQuoteNew.tsx` — novo bloco *Formato de Pagamento*, persistir `payment_terms`.
- `src/pages/app/AppQuoteDetail.tsx` — mostrar formato de pagamento (read-only).
- `src/lib/paymentTerms.ts` — novo (presets + cálculo de parcelas).
- `src/lib/quotePdf.ts` — secção condições de pagamento.
- `supabase/migrations/*` — `ALTER TABLE public.app_quotes ADD COLUMN payment_terms jsonb;`

## Fora deste plano (confirmar se queres incluir)

- Notificações por email automáticas para os lembretes (por agora só aparecem no dashboard).
- Marcar parcelas como pagas / módulo de recebimentos.
