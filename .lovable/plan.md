## Objetivo

Quando um novo utilizador se regista no Obreiro:
1. **Equipa recebe alerta** em `suporte@obreiro.pt`.
2. **Utilizador recebe boas-vindas** vindo de `no-reply@notify.obreiro.pt` (Reply-To: `suporte@obreiro.pt`).

## Como vai funcionar

Ambos os emails são disparados pelo mesmo evento: criação de um registo na tabela `profiles` (que já acontece automaticamente via trigger `handle_new_user` no signup).

Vou adicionar um segundo trigger nesse evento que chama uma Edge Function `notify-new-signup`, que por sua vez enfileira **dois** emails na infraestrutura de email já existente (`notify.obreiro.pt`):

```text
auth.users INSERT
   └─ handle_new_user (existente) → cria profiles
   └─ on_new_profile (novo)       → invoca notify-new-signup
                                       ├─ enqueue: signup-alert    → suporte@obreiro.pt
                                       └─ enqueue: welcome         → utilizador
```

## Passos

1. **Templates de email** (React Email, em `supabase/functions/_shared/transactional-email-templates/`):
   - `signup-alert.tsx` — alerta interno: nome, email, data, plano inicial.
   - `welcome.tsx` — boas-vindas ao utilizador com tom Obreiro (saudação, próximos passos, link para `/app`, CTA "Criar primeiro orçamento").
   - Registar ambos em `registry.ts`.
   - Estilo: Navy `#1B3A5C` + Burnt Orange `#E8730A`, Poppins/Inter, logo Obreiro no topo, fundo branco. Reply-To: `suporte@obreiro.pt`.

2. **Edge Function `notify-new-signup`**:
   - Recebe `{ user_id, email, display_name }`.
   - Invoca `send-transactional-email` 2x com `idempotencyKey` baseado no `user_id` (evita duplicados).
   - Endereço interno configurável via secret `SIGNUP_ALERT_TO` (default `suporte@obreiro.pt`).

3. **Trigger SQL** em `profiles` (AFTER INSERT) que chama a função via `pg_net` ou wrapper RPC. Alternativa mais simples: chamar a função diretamente do client após `signUp` bem-sucedido em `AppSignup.tsx` — menos confiável se o utilizador fechar a aba. **Recomendo o trigger DB** para garantir entrega.

4. **Infra de email** já está pronta (`notify.obreiro.pt` configurado, queue + cron ativos). Não é preciso reconfigurar.

5. **Deploy** das funções e migração.

## Detalhes técnicos

- Templates usam `@react-email/components@0.0.22` e seguem o padrão dos templates de auth já existentes.
- `welcome.tsx` props: `displayName`, `appUrl` (`https://www.obreiro.pt/app`).
- `signup-alert.tsx` props: `userEmail`, `displayName`, `signedUpAt`, `userId`.
- Idempotência: `idempotencyKey: \`welcome-${user_id}\`` e `signup-alert-${user_id}`.
- O trigger DB usa `SECURITY DEFINER` e chama `net.http_post` para a Edge Function com header de autorização interno.
- Sem dados sensíveis no alerta (sem palavra-passe, sem IP).

## Fora de âmbito

- Notificação por Slack/WhatsApp (pode ser adicionado depois).
- Digest diário em vez de email por cadastro (volume ainda baixo).
- Email de confirmação de endereço — já tratado pelos templates de auth scaffolded.
