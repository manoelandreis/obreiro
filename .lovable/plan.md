## Situação actual

| Componente | Estado |
|---|---|
| Delegação NS `notify.obreiro.pt` → `ns3/ns4.lovable.cloud` | ✅ OK (confirmado por DoH) |
| NS "informativos" no apex mostrados pela Dominios.pt | ✅ Irrelevante (confirmado pelo suporte) |
| Zoho / `manoel@obreiro.pt` (MX + SPF apex) | ✅ A funcionar |
| **Provisionamento Lovable de SPF/DKIM/MX em `notify.obreiro.pt`** | ❌ **Failed — timeout** |
| Auth hook (`auth-email-hook`) deployado e a enfileirar | ✅ OK |
| Templates de auth e transactional | ✅ Existem |
| `email_send_log` | Vazio (nada saiu ainda) |

**Diagnóstico:** o único bloqueador é o provisionamento do subdomínio ter marcado *Failed*. Enquanto estiver assim, qualquer email (confirmação de conta, reset de password, envio de orçamento, notificações) é enfileirado mas nunca entregue — expira no DLQ (15 min auth / 60 min app).

## O que falta para funcionar

### 1. Re-executar setup da infraestrutura de email (idempotente)
Chamar `email_domain--setup_email_infra`. Reconcilia queues, cron, vault e — mais importante — força um novo ciclo de provisionamento DNS na Lovable para `notify.obreiro.pt`. Não mexe em nada no lado da Dominios.pt.

### 2. Redeploy do `auth-email-hook`
Garantir que o hook está na última versão e a apontar para as queues actuais.

### 3. Verificar estado após ~2–5 min
Chamar `email_domain--check_email_domain_status` até estado passar de *Failed* → *awaiting_dns* → *active*. Se ficar novamente *Failed* após retry, é problema do lado da Lovable e abre-se suporte (não há mais nada a fazer no DNS).

### 4. Teste end-to-end
- Disparar um reset de password para a minha conta.
- Consultar `email_send_log` para confirmar `status = sent` (em vez de `pending`/`dlq`).
- Confirmar recepção na inbox.

### 5. (Opcional, recomendado) DMARC no apex
Adicionar TXT `_dmarc.obreiro.pt` com política mínima `v=DMARC1; p=none; rua=mailto:manoel@obreiro.pt` para melhorar deliverability tanto do Zoho como do `notify.`. Isto sim requer entrar na Dominios.pt.

## O que **não** vou fazer
- Não removo nem toco em NS do apex — o suporte confirmou que são informativos.
- Não mudo MX/SPF do Zoho.
- Não troco de provedor de email (Resend/SendGrid) — o problema é provisionamento, não escolha de serviço.
- Não altero a página `/admin/dns` (não é a causa do problema).

## Resultado esperado após execução
- Confirmação de conta ao registar → chega em segundos.
- Reset de palavra-passe → chega em segundos.
- Envio de orçamento por email (quando o botão for usado) → chega em segundos.
- Notificação interna de novo signup (`notify-new-signup`) → chega para `SIGNUP_ALERT_TO`.
- Todos os envios ficam auditáveis em `email_send_log` e visíveis em Cloud → Emails.
