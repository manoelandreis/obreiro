# Plano: Branding na App + Monetização em 3 Tiers

## Visão geral

Implementar em paralelo (1) capacidade de personalização de marca por utilizador autenticado em `/app`, e (2) sistema de subscrições Stripe com 3 tiers e paywall por funcionalidade. Domínio de email fica adiado até decisão de nome final.

---

## Fase 1 — Fundações (paywall + branding base)

### 1.1 Stripe Payments (seamless)
- Ativar `enable_stripe_payments` (sem necessidade de conta Stripe própria).
- Criar 3 produtos com preços recorrentes mensais:
  - **Free** — 0€ (sem checkout, default)
  - **Pro** — 12€/mês
  - **Business** — 29€/mês
- Webhook handler para sincronizar estado de subscrição.

### 1.2 Tabela de subscrições
- Nova tabela `user_subscriptions` (user_id, tier, status, stripe_customer_id, current_period_end).
- RLS: cada user vê só a sua. Service role escreve via webhook.
- Hook `useSubscription()` que devolve `{ tier, isPro, isBusiness, limits }`.

### 1.3 Página de Planos
- `/app/planos` com 3 cards comparativos.
- Botão "Subscrever" → Stripe Checkout.
- Portal de gestão (cancelar, atualizar cartão).

### 1.4 Storage bucket para branding
- Bucket privado `company-assets` (logos, fotos de obras, anexos).
- RLS por `auth.uid()` na primeira pasta do path.
- Limite tamanho: 5MB logo, 10MB por foto.

### 1.5 Estender `app_user_settings`
Novas colunas:
- `logo_url`, `brand_color_primary`, `brand_color_accent`
- `company_description` (text, max 2000 chars)
- `company_terms` (T&Cs reutilizáveis no PDF)
- `quote_validity_days` (default 30)
- `payment_conditions` (texto livre)

### 1.6 Página `/app/definicoes/marca`
- Upload de logo (preview live)
- Color picker para cores da empresa
- Editor de descrição, T&Cs, condições pagamento
- **Gated**: só Pro/Business consegue gravar (Free vê preview com lock).

---

## Fase 2 — Limites por tier

### 2.1 Matriz de limites

| Funcionalidade | Free | Pro | Business |
|---|---|---|---|
| Orçamentos/mês | 3 | ∞ | ∞ |
| Clientes guardados | 5 | ∞ | ∞ |
| Marca no PDF | "Feito com X" | sem marca | sem marca |
| Logo + cores no PDF | ❌ | ✅ | ✅ |
| Envio PDF por email | ❌ | ✅ | ✅ |
| Galeria fotos/anexos | ❌ | ✅ | ✅ |
| Tracking + estados | ❌ | ✅ | ✅ |
| T&Cs personalizadas | ❌ | ✅ | ✅ |
| Multi-utilizador | ❌ | ❌ | até 5 |
| Export SAF-T PT | ❌ | ❌ | ✅ |
| Conversão → fatura | ❌ | ❌ | ✅ |

### 2.2 Enforcement
- Componente `<FeatureGate feature="email_send">` que renderiza o botão real ou um CTA "Upgrade para Pro".
- Server-side: edge functions verificam tier antes de executar (envio email, contagem mensal).
- Contagem de orçamentos/mês via query a `app_quotes` (já existe `created_at`).

---

## Fase 3 — Funcionalidades premium

### 3.1 Branding completo no PDF
- Atualizar gerador de PDF para usar `logo_url`, cores da empresa, descrição.
- Free: rodapé "Orçamento criado com [Nome] — cria o teu grátis em [link]".
- Pro/Business: sem rodapé.

### 3.2 Envio de PDF por email ao cliente
- Edge function `send-quote-to-client`:
  - Gera PDF server-side (ou recebe blob do cliente)
  - Template React Email com branding do user
  - Envia via Lovable Emails (já configurado quando domínio for comprado; até lá, fallback para subdomínio default)
  - Regista em `quote_sends` (quote_id, sent_at, recipient, open_count)
- Rate-limit: 50 envios/dia/user.

### 3.3 Galeria fotos + anexos
- Nova tabela `quote_attachments` (quote_id, user_id, type: 'photo'|'file', storage_path, caption).
- UI no quote builder: zona drag-drop dentro de cada secção.
- Fotos aparecem no PDF (grid 2 colunas).

### 3.4 Tracking + estados
- Tabela `quote_status_history` (quote_id, status, changed_at).
- Enum: `rascunho`, `enviado`, `visto`, `aceite`, `rejeitado`, `expirado`.
- Pixel `<img>` 1x1 no email com endpoint que regista `visto`.
- Página pública `/q/[token]` onde cliente vê o PDF online e clica "Aceitar/Rejeitar" (sem conta).
- Notificação no app quando estado muda.

### 3.5 T&Cs e validade
- Campos já em `app_user_settings` (1.5).
- PDF mostra "Válido até DD/MM/YYYY", T&Cs no rodapé/última página, condições pagamento em secção própria.
- Job diário (pg_cron) marca orçamentos como `expirado` após validade.

---

## Fase 4 — Polimento

- Onboarding: ao criar conta, wizard de 3 passos (logo, cores, descrição) → desbloqueia primeiro orçamento personalizado.
- Banner "Tens 1 orçamento Free este mês" quando próximo do limite.
- Email transacional: "O teu orçamento foi visto pelo cliente".
- Dashboard `/app`: métricas (orçamentos enviados, taxa de aceitação, valor médio).

---

## Detalhes técnicos

**Schema novo (resumo):**
- `user_subscriptions`, `quote_attachments`, `quote_sends`, `quote_status_history`
- Colunas extra em `app_user_settings` e `app_quotes` (status, public_token, expires_at)
- Bucket `company-assets` (privado, RLS por user_id na pasta raiz)
- Bucket `quote-attachments` (privado, RLS por user_id)

**Edge functions novas:**
- `stripe-checkout` (cria sessão)
- `stripe-webhook` (sincroniza subscrições)
- `send-quote-to-client` (envia PDF + regista envio)
- `track-quote-open` (pixel)
- `quote-public-action` (cliente aceita/rejeita via token público)

**Dependências:**
- Stripe via Lovable Payments (sem secret manual)
- Lovable Emails para envio de PDFs (domínio fica em subdomínio default até comprares o teu)
- React Email para templates

---

## Ordem de execução sugerida

1. **Sprint 1** (Fase 1.1–1.5): Stripe + tabela subscrições + página planos + bucket + colunas branding
2. **Sprint 2** (Fase 1.6 + 2): Página de marca + FeatureGate + matriz de limites enforced
3. **Sprint 3** (Fase 3.1 + 3.2): Branding no PDF + envio por email
4. **Sprint 4** (Fase 3.3 + 3.4): Galeria + tracking/estados
5. **Sprint 5** (Fase 3.5 + 4): T&Cs/validade + onboarding + polimento

Cada sprint é deployável de forma independente.

---

## Fora deste plano (decisão futura)

- **Domínio próprio + email branded**: assim que decidires o nome (recomendo brainstorm separado).
- **SAF-T PT export** (Business tier): complexo, fica para sprint dedicado depois do Business ter clientes reais.
- **Multi-utilizador** (Business): requer convites, roles por workspace — sprint próprio.
