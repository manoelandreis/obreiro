# Auth pages — logo, terminologia PT e best practices de password/email

## Objetivo
Atualizar Signup, Login, Forgot Password e Reset Password para:
1. Usar o logo oficial `src/assets/obreiro-logo.png` (substituir o ícone `Briefcase`).
2. Substituir "Password" por "Palavra-passe" em toda a UI.
3. Aplicar best practices de criação de conta (força de password, validação de email, sem duplicados).

## Mudanças por ficheiro

### `src/pages/app/AppSignup.tsx`
- Substituir o bloco com `<Briefcase>` pelo `<img src={obreiroLogo} />` (32×32, mantendo o quadrado laranja arredondado e shadow já usados noutras páginas).
- Renomear label "Password" → "Palavra-passe".
- Renomear botão "Criar conta" mantém-se; subtítulo mantém-se.
- **Validação email** (Zod):
  - formato válido, max 255 chars, trim/lowercase.
  - Mensagem custom PT ("Email inválido").
- **Verificação de email duplicado** antes do `signUp`:
  - Chamar `supabase.auth.signInWithOtp({ email, shouldCreateUser: false })` é frágil; em alternativa, depender da resposta do `signUp` (Supabase devolve erro `User already registered`) e mapear para mensagem PT: "Já existe uma conta com este email. [Entrar]".
  - Adicionar validação on-blur com debounce que tenta `signInWithOtp({ email, options: { shouldCreateUser: false }})` e interpreta `Signups not allowed for otp` (existe) vs `Signups not allowed` / outro (não existe). Para evitar enviar OTP, usar abordagem mais simples: validar apenas no submit via erro do signUp. **Decisão:** validar no submit (sem chamada extra), mostrar mensagem clara com link para login.
- **Password rules** (client-side):
  - Mínimo 8 caracteres.
  - Não pode ser igual ao email (nem à parte local antes do `@`) nem ao nome.
  - Verificar contra lista de passwords comuns (lista curta embebida: `123456789`, `password`, `qwerty123`, `obreiro123`, etc. — ~50 entradas).
  - Calcular força (fraca/média/forte) com heurística: comprimento + variedade (minúsculas, maiúsculas, dígitos, símbolos).
- **Indicador de força visual**:
  - Barra de 3 segmentos (vermelho/amarelo/verde via tokens `--destructive`, `--accent` orange, `--primary` ou green semantic).
  - Lista de requisitos com check/cross icons que atualizam em tempo real:
    - ≥ 8 caracteres
    - Letras + números
    - Não igual ao nome/email
    - Não está na lista comum
- HIBP server-side: ativar via `supabase--configure_auth` com `password_hibp_enabled: true` (uma chamada, sem necessitar input do user).
- Bloquear submit se força = fraca ou regras falham; mostrar erros inline em vez do tooltip nativo (`noValidate` no form).

### `src/pages/app/AppLogin.tsx`
- Trocar `Briefcase` por logo `obreiroLogo`.
- Label "Password" → "Palavra-passe".

### `src/pages/app/AppForgotPassword.tsx`
- Trocar `Briefcase` por logo `obreiroLogo`.

### `src/pages/app/AppResetPassword.tsx`
- Trocar `Briefcase` por logo.
- Aplicar as mesmas regras de força (≥8, não comum, variedade) e mesmo indicador visual; subir `minLength` de 6 para 8.

### Novo: `src/lib/passwordPolicy.ts`
- `COMMON_PASSWORDS: Set<string>` (lista curta PT/EN).
- `evaluatePassword(password, { email?, name? }): { score: 0|1|2|3, label: 'fraca'|'média'|'forte', checks: {minLength, variety, notCommon, notPersonal}, valid: boolean }`.
- Unit tests opcionais em `src/lib/passwordPolicy.test.ts` (skip se acrescentar fricção).

### Novo: `src/components/app/PasswordStrengthMeter.tsx`
- Recebe `result` de `evaluatePassword`. Renderiza barra (3 segmentos) + checklist.

## Backend
- `supabase--configure_auth` com `password_hibp_enabled: true` (mantém `disable_signup: false`, `external_anonymous_users_enabled: false`, `auto_confirm_email: false`). Isto faz Supabase rejeitar passwords vazadas via HIBP.

## Fora de scope
- Não mexer no fluxo de envio de email transacional.
- Não criar verificação async server-side de email duplicado (depender da resposta do signUp).
- Não alterar a landing page nem o app shell.
