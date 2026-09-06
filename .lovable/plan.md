# Verificação da página "Novo Orçamento" (telemóvel e computador)

## O que já testei
Abri a página de criação de orçamento nos dois tamanhos (telemóvel 390px e computador 1280px) e:
- Todas as secções aparecem: Título, Cliente, Serviços e Materiais, Pagamento, Notas / Termos e Condições, e o resumo de totais.
- Abrir e fechar cada secção funciona nos dois tamanhos, incluindo a pré-visualização do pagamento.
- Não houve erros de funcionamento (apenas avisos técnicos antigos que já existiam em toda a aplicação).

## Pontos a corrigir
1. **Logótipo no topo aparece partido** (quadrado com imagem em falta) no telemóvel e no computador. Vou confirmar se é só do ambiente de testes; se for real, garanto que carrega e que mostra o nome quando a imagem falha.
2. **Botão "Guardar Orçamento" no telemóvel**: aparece duas vezes (topo e fundo). Confirmar se é intencional; caso contrário, manter só o do fundo.
3. **Cabeçalho "Pagamento" no telemóvel**: o resumo ao lado do título fica apertado — passar o resumo para uma segunda linha em ecrãs pequenos.

## Como valido no fim
Percurso completo no telemóvel e no computador: escolher/criar cliente, preencher um serviço com material, escolher modelo de pagamento, adicionar notas e guardar o orçamento — confirmando que grava e abre corretamente.

## Nota técnica
Alterações limitadas a `src/components/app/quote-new/*`, ao invólucro `CollapsibleSection` e ao cabeçalho da aplicação; sem mudanças de lógica de negócio nem no PDF.
