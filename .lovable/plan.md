

# Email-First Download + Consent de Comunicação

## Contexto

Atualmente o Step 4 tem apenas um botão "Download PDF" e um nudge para waitlist em baixo. A ideia é inverter a prioridade: captar o email primeiro como ação principal, manter o download direto como secundário, e adicionar consentimento de comunicação.

## Plano

### 1. Redesign do Step 4 - Área de Ações

Substituir o bloco atual de botões por uma nova secção com duas opções claras:

**Ação Primária** — "Enviar para o meu email"
- Campo de email (pré-preenchido com o email do cliente se já foi inserido no Step 2)
- Checkbox de consentimento: "Aceito receber comunicações da HandyFlow sobre novidades e funcionalidades"
- Botão principal grande: "Enviar Orçamento por Email"
- Ao submeter: guarda o email na tabela `waitlist_leads` (se consentiu) + envia o PDF por email + mostra toast de sucesso

**Ação Secundária** — "Download PDF"
- Botão mais discreto (variant outline/ghost) abaixo: "Ou faça download direto do PDF"
- Funciona como hoje, sem pedir email

Remover o bloco de "waitlist nudge" no final (já não é necessário porque estamos a captar o lead na ação principal).

### 2. Envio de Email

Para enviar o orçamento por email precisamos de configurar o sistema de email (app emails). O fluxo será:
- Criar um template de email "quote-delivery" com o orçamento em HTML
- Usar a infraestrutura de email do Lovable Cloud para enviar
- O email conterá o orçamento formatado (mesmo HTML que já usamos no print)

**Nota:** Isto requer que o domínio de email esteja configurado. Se ainda não estiver, faremos o setup primeiro.

### 3. Base de Dados

- Usar a tabela `waitlist_leads` existente para guardar os emails captados (com `source: 'quote_email'` para distinguir)
- Adicionar tracking event `email_sent` na tabela `quote_events`

### 4. Disclaimer de Consentimento

Checkbox obrigatória antes de submeter o email com texto claro sobre comunicações futuras. O email só é guardado como lead se o checkbox estiver marcado.

### Ficheiros alterados

- **Quote.tsx** — Redesign do Step 4 com email-first flow, checkbox de consentimento, botão primário/secundário
- **Template de email** — Criar template transactional para envio do orçamento
- **Edge function setup** — Configurar infraestrutura de email se necessário

