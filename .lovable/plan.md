

# Atualizar Step 3 do Quote: Serviços + Materiais

## O que muda

O step 3 do orçamento passa a ter **dois tipos de itens separados**:

### Serviços (trabalho a realizar)
- Nome do serviço (ex: "Pintura Interior")
- Descrição
- Preço por Hora (€)
- Horas Aproximadas
- Subtotal = preço/hora × horas

### Materiais (o que se compra para o serviço)
- Nome do material (ex: "Tinta Interior")
- Quantidade
- Unidade (un, kg, L, m², etc.)
- Preço Unitário (€)
- Subtotal = qtd × preço unitário

## Alterações técnicas

1. **Novos tipos** — Substituir `QuoteItem` por `ServiceItem` e `MaterialItem`, cada um com os seus campos
2. **Step 3 UI** — Duas secções separadas com "Adicionar Serviço" e "Adicionar Material", cada uma com o formulário adequado
3. **Totais** — Subtotal serviços + subtotal materiais = subtotal geral → IVA → total
4. **Step 4 Preview** — Tabela de serviços (colunas: Serviço, Descrição, €/Hora, Horas, Total) + tabela de materiais (colunas: Material, Qtd, Unidade, Preço Unit., Total)
5. **PDF** — Atualizar o HTML do print para refletir as duas tabelas
6. **Templates** — Os templates existentes podem ser atribuídos como materiais (mantêm qtd/unidade/preço) ou como serviços (preço/hora + horas)

Nenhuma alteração à base de dados é necessária — os dados do orçamento são client-side e o `quote_logs` guarda apenas o resumo.

