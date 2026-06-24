# Redesign dos Emails da Obreiro

## Situação atual

- O projeto **não tem domínio de email configurado** nem templates de auth/app.
- A única função de email existente é `send-quote-email` (envio de orçamentos para clientes), não relacionada aos 6 templates do documento.
- Os 6 emails do briefing **ainda não existem** — vão ser criados de raiz.

## O que vai ser feito

### 1. Configurar domínio de envio
Abrir o diálogo de setup de email para registar um subdomínio dedicado (sugestão: `notify.obreiro.pt`). O endereço visível continua a poder ser `suporte@obreiro.pt` no remetente; o subdomínio serve para autenticação DNS (SPF/DKIM). Após o setup, infraestrutura de fila (pgmq, cron, log de envios, supressões) é provisionada automaticamente.

### 2. Templates de Autenticação (4)
Criados via scaffold oficial em `supabase/functions/_shared/email-templates/` + `auth-email-hook`:

| # | Template | Assunto | Trigger |
|---|---|---|---|
| 1 | **signup** (Bem-vindo + Confirmação) | Bem-vindo à Obreiro.pt 🎉 | Criação de conta |
| 2 | **recovery** (Recuperação) | Redefina a sua senha | Esqueci a senha |
| 3 | **email-change** (Alteração de dados) | Confirme o seu novo email | Mudança de email |
| 4 | **magic-link / reauthentication** | Confirme o seu acesso | Reautenticação |

*Nota:* "Bem-vindo" e "Confirmação de email" do documento são o mesmo evento técnico no Supabase Auth (`signup`) — um único template cobre ambos com o copy do "Bem-vindo".

### 3. Templates de App (2)
Criados via scaffold transacional em `supabase/functions/_shared/transactional-email-templates/` + `send-transactional-email`:

| # | Template | Assunto | Trigger |
|---|---|---|---|
| 5 | **account-deleted** | A sua conta foi cancelada | Eliminação da conta (cascade GDPR) |
| 6 | **security-alert** | ⚠️ Atividade anormal na sua conta | Login suspeito (manual/admin por agora) |

### 4. Identidade visual (aplicada a todos os 6)
Baseado no mockup anexo e no design system existente (`src/index.css`):

- **Fundo da página**: `#FFF5EB` (creme claro, off-white quente)
- **Card principal**: `#FFFFFF`, cantos arredondados ~16px, sombra suave
- **Logo**: ícone Obreiro (laranja com chave-de-fendas) + wordmark "Obreiro" em Poppins bold no topo
- **Headings**: Poppins, peso 700, cor `#1B3A5C` (Navy primário)
- **Corpo**: Inter / Arial fallback, ~16px, cor cinza-escura
- **Botão CTA**: Burnt Orange `#E8730A`, full-width no card, branco, peso 600, cantos ~10px, sombra laranja suave (glow)
- **Link de fallback**: texto cinza pequeno abaixo do botão
- **Footer**: fora do card, com tagline "Simples como uma chave de fendas.", linha de contactos (`www.obreiro.pt • suporte@obreiro.pt • +351 925 195 230`), copyright `© 2026 Obreiro.pt` e badge "🇵🇹 Feito em Portugal."
- Copy 100% em **português de Portugal**, conforme briefing

### 5. Wiring & deploy
- Deploy de `auth-email-hook`, `send-transactional-email`, `process-email-queue` e `handle-email-unsubscribe`
- Hook de eliminação de conta na app (`AppSettings`) chama `send-transactional-email` com template `account-deleted` antes do delete cascade
- Página `/unsubscribe` simples para o link de footer dos emails de app

## Fora do âmbito

- Alterar o `send-quote-email` existente (continua igual)
- Email de alerta de segurança automático por geolocalização — fica como template pronto, mas o trigger automático de "login suspeito" requer infraestrutura extra (proposta separada se quiser)
- Imagens de redes sociais no footer (não há contas indicadas)

## Detalhes técnicos

- **Stack**: React Email (`@react-email/components@0.0.22`) em `.tsx`, runtime Deno
- **Variáveis dinâmicas**: `siteName`, `siteUrl`, `recipient`, `confirmationUrl`, `userName` (extraído de `raw_user_meta_data.display_name`)
- **Idempotência**: chave `account-deleted-<userId>` para evitar duplicados em retries
- **Fila**: TTL auth 15min, app 60min; retry automático até 5 tentativas; bounces vão para `suppressed_emails`
- **Footer obrigatório**: o sistema acrescenta link de unsubscribe nos emails de app — não duplicar no template

## Antes de avançar

Antes da implementação começo por abrir o **diálogo de setup do domínio de email**. Vai precisar de adicionar 2 registos NS no seu provedor de DNS (onde está registado `obreiro.pt`) para delegar o subdomínio `notify.obreiro.pt` ao Lovable. Os emails só começam a sair após a verificação DNS, mas o código fica todo pronto entretanto.
