# Integrações externas

Configuradas via variáveis de ambiente (no painel do teu host, ex: Vercel/Netlify). Se uma variável não estiver definida, a integração faz no-op silenciosamente — útil em dev.

## 1. PostHog (product analytics + session replay)

1. Cria conta gratuita em https://eu.posthog.com (escolhe EU para GDPR).
2. Copia o **Project API Key** (começa por `phc_`).
3. Define:
   - `VITE_POSTHOG_KEY=phc_xxx`
   - `VITE_POSTHOG_HOST=https://eu.i.posthog.com` (opcional)
4. Faz redeploy. Eventos `$pageview` começam imediatamente. Usa `trackPosthog('quote_sent', {...})` para eventos custom.

Free tier: 1M eventos/mês, session replay 5k sessões/mês.

## 2. Crisp (chat de suporte + knowledge base)

1. Cria conta em https://crisp.chat (plano free).
2. Settings → Website Settings → copia o **Website ID** (UUID).
3. Define `VITE_CRISP_WEBSITE_ID=xxxxx-xxx-...`
4. Faz redeploy. O widget aparece em todas as páginas; users autenticados são identificados automaticamente via `identifyCrisp` no `AppLayout`.

## 3. Loops.so (sequências de email)

1. Cria conta em https://loops.so.
2. Cria uma audience e copia a API Key.
3. Adiciona o secret `LOOPS_API_KEY` em Lovable Cloud (Backend → Secrets).
4. A edge function `lead-capture` envia automaticamente o contacto para o Loops quando um lead é capturado (a implementar quando o secret estiver definido).

## 4. Resend (transacional)
Já está integrado nas edge functions; só precisas do `RESEND_API_KEY` configurado e do domínio verificado.
