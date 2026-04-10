

# Analytics Avançados + Explicação de Conceitos

## Conceitos atuais

**Leads** = pessoas que se inscreveram na waitlist (tabela `waitlist_leads`). São visitantes interessados que deixaram o email.

**Orçamentos** = cada vez que alguém gera e faz download de um orçamento (tabela `quote_logs`). Guarda nome da empresa, cliente, valor total e quantidade de itens.

**Conversão** = percentagem de leads que geraram orçamento. Atualmente é um cálculo simples: `orçamentos / leads × 100`. Na prática, não há ligação direta entre um lead e um orçamento (são tabelas independentes), então é uma métrica aproximada.

## O que precisa mudar para ter analytics mais ricos

Atualmente, `quote_logs` guarda apenas o resumo final (nome, valor, qtd itens). Não há dados sobre:
- Em que step o utilizador parou (abandono)
- Quantas vezes fez download
- Que templates/serviços foram usados

Para isso, precisamos de **mais dados na base de dados**.

## Plano

### 1. Nova tabela `quote_events` (tracking de comportamento)

Registar eventos do fluxo do orçamento:
- `step_reached` — quando o user avança para cada step (1→2→3→4)
- `download` — cada vez que faz download
- `template_used` — quando adiciona um template da lista

Colunas: `id`, `event_type`, `step_number`, `template_id`, `session_id` (UUID gerado no browser para agrupar a sessão), `metadata` (JSONB para dados extra), `created_at`

### 2. Instrumentar o Quote.tsx

- Gerar um `sessionId` ao montar o componente
- Inserir evento `step_reached` cada vez que o step muda
- Inserir evento `template_used` quando seleciona template
- Inserir evento `download` no handleDownloadPDF (além do quote_log existente)

### 3. Expandir `quote_logs` com campo `services_summary`

Adicionar coluna JSONB `services_summary` ao `quote_logs` para guardar os nomes dos serviços e materiais usados (sem alterar as colunas existentes).

### 4. Dashboard de Analytics melhorado

Novos cards e gráficos:
- **Funil de Steps**: Quantos users chegaram ao Step 1 → 2 → 3 → 4 (gráfico de funil)
- **Taxa de Abandono**: Em que step as pessoas param
- **Downloads totais** vs orçamentos únicos
- **Templates mais usados**: ranking dos templates/serviços mais populares
- **Valor médio** dos orçamentos

### 5. RLS

- `quote_events`: INSERT público (qualquer visitante), SELECT só admin

## Resumo de ficheiros alterados

- **Migration**: criar `quote_events`, adicionar `services_summary` a `quote_logs`
- **Quote.tsx**: adicionar tracking de eventos (step changes, template selection, download)
- **AdminAnalytics.tsx**: novos cards, gráfico de funil, ranking de templates

