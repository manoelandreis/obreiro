# Ajuste no Preview do Orçamento

## Problema
O preview inline do orçamento está a esconder os valores totais (`hideTotals: true`), o que quebra a fidelidade do documento. O utilizador quer que o preview mostre **exatamente** o que o cliente vê. A barra flutuante em baixo deve continuar a mostrar o total como atalho de verificação rápida.

## Alteração

### 1. Reverter `hideTotals` no preview inline
Ficheiro: `src/pages/app/AppQuoteDetail.tsx`

- Alterar `buildHtml(true)` para passar `hideTotals: false` (ou remover a opção, usando o default).
- O preview inline deve renderizar o orçamento completo, com totais visíveis.

### 2. Manter a barra flutuante
Não alterar a barra de ações inferior. Continua a mostrar o total com IVA como atalho rápido.

### 3. Verificação
- Confirmar que o `buildQuoteHtml` em `src/lib/quotePdf.ts` renderiza os totais quando `hideTotals` é omitido ou `false`.
- Verificar no preview que o documento aparece completo.

## Não alterar
- Nada mais na página de detalhe, dashboard, ou outros fluxos.
- Nenhuma migração de base de dados necessária.
