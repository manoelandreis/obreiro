## Objetivo
Melhorar a criação de orçamentos na landing page (`/v2`):
1. Adicionar **IBAN** e **MBWAY** aos dados da empresa.
2. Adicionar seleção de **Modelo de Pagamento** (apenas templates pré-definidos, sem personalização).

## Alterações em `src/pages/IndexV2.tsx`

### 1. Dados da Empresa
Estender o tipo `CompanyInfo` e o estado inicial com:
- `iban: string` — campo "IBAN" (placeholder `PT50...`)
- `mbway: string` — campo "MBWAY" (placeholder telefone, ex: `+351 9XX XXX XXX`)

Adicionar ambos os inputs na secção "Dados da Empresa", numa nova linha em grid de 2 colunas, depois do telefone e antes da morada.

Mostrar os dois campos (quando preenchidos) no preview/PDF do orçamento, junto aos restantes dados da empresa.

### 2. Modelo de Pagamento
- Adicionar nova secção colapsável **"Pagamento"** entre "Serviços" e "Notas" (mesmo padrão visual: header com chevron + conteúdo).
- Conteúdo: um único `Select` com label "Modelo" listando apenas os 4 presets fixos (sem "Personalizado", sem botão "+ Novo modelo personalizado"):
  - 100% à conclusão
  - 50% adiantamento + 50% final
  - 30% adiantamento + 70% final
  - Pagamento a 30 dias
- Reaproveitar `PAYMENT_PRESETS` de `src/lib/paymentTerms.ts` filtrando `id !== 'custom'`.
- Estado: `const [paymentPreset, setPaymentPreset] = useState<PaymentPreset>('100_end')`.
- Atualizar `expandedSections` para incluir `payment: false`.

### 3. Render no preview/PDF
Adicionar bloco "Condições de Pagamento" no preview (e no HTML de impressão) listando as parcelas do preset selecionado, com percentagem e label — apenas texto, sem cálculo de datas (já que não há data âncora pedida na landing).

Exemplo no preview:
> **Condições de Pagamento:** 50% adiantamento · 50% final

Incluir também IBAN/MBWAY numa pequena caixa "Dados de pagamento" quando preenchidos.

## Fora de âmbito
- Sem persistência de templates personalizados.
- Sem alterações ao app autenticado (`/app/*`).
- Sem alterações ao backend.
