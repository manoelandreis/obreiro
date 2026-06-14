# Plano — Passo final do builder + CTA final

Alterações limitadas a `src/pages/IndexV2.tsx`. Sem mudanças no design system, componentes ou lógica de cálculo. Também é necessário um pequeno ajuste em `src/pages/Quote.tsx` para manter o paralelo (mesmo bloco), mas o foco é `IndexV2`.

## 1. Substituir o bloco "Receber orçamento por email" (linhas ~523–543)

Novo bloco com cabeçalho + três ações por ordem de prioridade.

**Cabeçalho do bloco** (acima das ações, abaixo do total):
- Título: `O teu orçamento está pronto` (font-heading, semibold)
- Sub: `Guarda-o, recebe-o por email ou descarrega já.` (text-muted-foreground)

**Ação 1 — Criar conta e guardar (primária, destaque laranja claro)**
- Container: `bg-[#FFF6EC] rounded-xl p-6` (usa accent-soft existente se já mapeado a esse tom; caso contrário inline).
- Ícone (Save/BookmarkPlus) + título laranja semibold: `Guardar este orçamento`
- Texto: `Cria conta grátis no Obreiro e tem os teus orçamentos, clientes e preços sempre à mão. O próximo começa com 80% feito.`
- Botão `variant="accent"` full-width: `Criar conta grátis e guardar →`
  - onClick: `trackEvent('account_signup_started', {...})` e `navigate('/app/signup')` (rota já existe). Persistir o rascunho do orçamento em `sessionStorage` sob chave `obreiro:pending_quote` para o signup poder recuperar (implementação real do "guardar após signup" pode vir depois — basta deixar o payload escrito).
- Nota cinza pequena: `Grátis para começar. Sem cartão.`

**Ação 2 — Receber por email (secundária, neutra)**
- Container neutro `border border-border rounded-xl p-5`.
- Título: `Receber por email` (semibold)
- Microcopy: `Enviamos o teu orçamento para este email.`
- Input email (placeholder `o.teu@email.pt`).
- Checkbox **separado, opcional, não bloqueia o envio**: `(opcional) Quero receber dicas e novidades do Obreiro. Pode cancelar a qualquer momento.`
- Botão `variant="outline"` (estilo outline laranja): `Receber orçamento por email`
- Nota: `Sem spam.`
- Lógica `handleSendByEmail` mantém o invoke da edge function. O insert em `waitlist_leads` só ocorre se `consentChecked === true` (já é assim). Adicionar `trackEvent('email_delivery_requested')` sempre e `trackEvent('newsletter_opt_in')` quando checkbox marcado.

**Ação 3 — Download direto (terciária, ghost)**
- Botão `variant="ghost"` ou link discreto: `Ou descarregar o PDF agora`
- onClick: chama `handleDownloadPDF` existente + `trackEvent('pdf_download_direct')`.

**Linha de privacidade reformulada** (substitui a frase atual na linha 541):
> 🛡️ Por defeito, nada fica guardado — processamento 100% local. Só guardamos o teu orçamento se criares conta.

## 2. Reformular CTA final / secção waitlist (linhas ~760–785)

Manter a secção visual (navy bg, layout), trocar conteúdo:
- H2: `O orçamento online é só o começo`
- Sub: `A app Obreiro guarda os teus clientes, templates e histórico — tudo num sítio. Grátis para começar.`
- Remover o formulário de waitlist. Em vez disso, um único botão `variant="accent"` size lg: `Criar conta grátis` → `navigate('/app/signup')`.
- Manter a linha de benefícios pequenos (`Sem spam` substituído por `Sem cartão · Cancelar quando quiser · Feito em PT`).
- Remover state e handler `handleWaitlist`, `waitlistEmail`, `waitlistName`, `waitlistSubmitting` se já não usados em outro lado da página. Verificar o link de nav `#waitlist` (linha 221) e renomear âncora para `#conta` ou manter id mas atualizar label para `Conta`.

## 3. Microcopy global da secção

- Sentence case em todos os botões/títulos do bloco de entrega.
- Verbo "Receber" tanto no título como no botão de email (corrigir `Enviar Orçamento por Email` → `Receber orçamento por email`).

## 4. Analytics

Adicionar chamadas a `trackEvent` (já existe util) para:
- `pdf_download_direct`
- `email_delivery_requested`
- `newsletter_opt_in`
- `account_signup_started`

`account_signup_completed` fica fora deste passo (deve ser disparado em `AppSignup.tsx` após sucesso) — incluir uma TODO/registo só se trivial; caso contrário deixar para iteração seguinte.

## 5. Detalhes técnicos

- Persistência do rascunho ao clicar em "Criar conta grátis e guardar": gravar `{ company, client, services, notes, total }` em `sessionStorage` antes do `navigate`. A leitura/uso em `AppSignup` fica fora do âmbito deste prompt; só preparamos o payload.
- Nenhuma migração nem mudança de schema.
- Sem alterações em `Quote.tsx` salvo se o utilizador pedir paridade (este prompt foca o builder principal usado na landing `IndexV2`).

## Ficheiros tocados

- `src/pages/IndexV2.tsx` — bloco de entrega (Passo 4) e secção waitlist → CTA conta.

## Fora do âmbito

- Lógica de "guardar automaticamente o orçamento na conta após signup" (apenas preparamos o payload em sessionStorage).
- Alterações ao design system, cores globais, ou outras secções da página.
- Tradução/refactor da rota `Quote.tsx`.
