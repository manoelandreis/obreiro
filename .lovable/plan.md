# Redesign de emails no estilo Obreiro

Aplicar o design da referência (Figma / imagem enviada) a **todos** os templates de email da plataforma, garantindo consistência visual entre auth emails e app emails.

## Estilo visual a aplicar

Baseado na referência:
- **Fundo geral**: creme suave `#FBF6EF`
- **Card interno**: branco `#FFFFFF`, cantos arredondados (16px), padding generoso
- **Header**: logo Obreiro (ícone laranja em rounded square) + wordmark "Obreiro" em bold escuro, alinhado à esquerda, fora do card
- **Título (H1)**: Poppins/sans bold, ~32px, cor `#1B1B1B`
- **Corpo**: sans-serif 16px, cor `#3A3A3A`, line-height generoso
- **CTA button**: laranja `#E8730A` (accent do projeto), texto branco bold, full-width, radius 12px, sombra laranja suave
- **Link fallback**: texto pequeno cinza com link
- **Footer** (fora do card):
  - Tagline em bold: "Simples como uma chave de fendas."
  - Linha de contactos: `www.obreiro.pt · suporte@obreiro.pt · +351 925 195 230` em cinza
  - Linha final: `© 2026 Obreiro.pt. Todos os direitos reservados.` à esquerda, `🇵🇹 Feito em Portugal.` em vermelho à direita

## Ficheiros a atualizar

**Auth emails** (`supabase/functions/_shared/email-templates/`):
1. `signup.tsx` — "Olá [Nome], Muito bem! A sua conta na Obreiro.pt foi criada com sucesso…" + CTA "Confirmar email"
2. `recovery.tsx` — Redefinição de palavra-passe, CTA "Redefinir palavra-passe"
3. `magic-link.tsx` — Link mágico de acesso, CTA "Entrar na Obreiro"
4. `invite.tsx` — Convite para a plataforma, CTA "Aceitar convite"
5. `email-change.tsx` — Confirmação de novo email, CTA "Confirmar novo email"
6. `reauthentication.tsx` — Código OTP em destaque (caixa com código grande) em vez de botão

**App emails** (`supabase/functions/_shared/transactional-email-templates/`):
7. `welcome.tsx` — Boas-vindas depois de confirmar, CTA "Entrar na plataforma"
8. `signup-alert.tsx` — Alerta interno para a equipa (manter minimalista mas com mesmo header/footer)

## Componente partilhado

Criar `supabase/functions/_shared/email-templates/_layout.tsx` com:
- `<EmailShell>` — header (logo+wordmark), card branco, footer completo
- Constantes de cores/estilos partilhadas
- Assinatura tipada para receber `preview`, `heading`, `children`

Todos os templates passam a importar este shell, eliminando duplicação e garantindo consistência.

**Logo**: uso do PNG existente `obreiro-logo.png` via URL absoluto pública (upload prévio para bucket `email-assets` se ainda não existir, ou usar asset já publicado no site).

## Copy (PT-PT)

Reescrever todas as strings em português europeu, tom próximo ao da referência:
- "Palavra-passe" (não "password")
- "A sua conta", "confirme o seu endereço"
- Tagline consistente no footer

## Deploy

Após edições, redeploy da função `auth-email-hook` (para novos templates auth) — não é necessário redeployar `send-transactional-email` só por mudança de templates, mas será feito por segurança.

## Fora de scope

- Não alterar lógica de envio, fila, ou infraestrutura de email
- Não mexer em `auth-email-hook/index.ts` (apenas renderiza os templates)
- Não criar novos tipos de email
