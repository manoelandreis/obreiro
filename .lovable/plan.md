# Desativar confirmação de email (temporário para MVP)

## O que muda
- Ativar **auto-confirm** no Supabase Auth. Novos utilizadores ficam com email confirmado automaticamente e entram direto na app após o signup, sem precisar clicar no link do email.

## O que NÃO muda
- Templates de email (signup, recovery, magic-link, etc.) permanecem intactos em `supabase/functions/_shared/email-templates/`.
- `auth-email-hook` continua deployado e funcional.
- Domínio `notify.obreiro.pt` continua verificado.
- Emails de **recuperação de palavra-passe**, **magic link** e transacionais (welcome, signup-alert) continuam a ser enviados normalmente — só o email de "Confirme o seu email" deixa de bloquear o acesso.
- Utilizadores já existentes não são afetados.

## Como reverter depois
Basta pedir "reativar confirmação de email" e eu volto a chamar `configure_auth` com `auto_confirm_email: false`. Zero código a mudar.

## Passos técnicos
1. Chamar `supabase--configure_auth` com:
   - `auto_confirm_email: true`
   - `disable_signup: false`
   - `external_anonymous_users_enabled: false`
   - `password_hibp_enabled: true` (manter proteção HIBP já ativa)
2. Confirmar ao utilizador e lembrar como reverter.

## Nota de segurança
Auto-confirm em MVP é aceitável, mas significa que qualquer pessoa pode registar-se com um email que não é dela (não há prova de posse do endereço). Recomendo reativar antes de lançar publicamente ou de começar a enviar comunicações importantes para esses emails.
