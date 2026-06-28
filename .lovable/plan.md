## Problema

Ao abrir `/admin` o root renderiza apenas Toaster + CookieConsent. Nem o `AdminLogin` (Card "Obreiro Admin") nem o estado "A carregar..." do `AdminLayout` aparecem, e não há `console.error`/`pageerror`. Diagnóstico via Playwright confirmou: `/` e `/app/login` renderizam normalmente, só `/admin` fica em branco.

Causa: as rotas `<Route path="/admin" element={<AdminLogin/>} />` e `<Route path="/admin/*" element={<AdminLayout/>}>` partilham o mesmo pathname. Quando o splat ganha o match (ou quando o `AdminLayout` redireciona com `<Navigate to="/admin" replace />` sem haver sessão), o resultado é um `Navigate` que renderiza `null` em vez do formulário de login → ecrã branco.

## Correção

Eliminar a ambiguidade de rotas e remover o redirect circular.

1. **`src/App.tsx`** — substituir o bloco admin por rotas explícitas, sem splat:
   ```tsx
   <Route path="/admin" element={<AdminLogin />} />
   <Route element={<AdminLayout />}>
     <Route path="/admin/dashboard" element={<AdminDashboard />} />
     <Route path="/admin/users" element={<AdminUsers />} />
     <Route path="/admin/leads" element={<AdminLeads />} />
     <Route path="/admin/content" element={<AdminContent />} />
     <Route path="/admin/templates" element={<AdminTemplates />} />
     <Route path="/admin/analytics" element={<AdminAnalytics />} />
   </Route>
   ```
   Assim `/admin` só corresponde ao login; o layout só envolve sub-páginas autenticadas.

2. **`src/components/AdminLayout.tsx`** — confirmar que continua a redirecionar não‑admins para `/admin` (agora seguro, porque essa rota é o login e não monta o layout).

3. **Verificação** — após o build, abrir `/admin` em desktop e mobile (390 px) via Playwright e confirmar que o card "Obreiro Admin" aparece; clicar "Entrar" com credenciais admin e validar navegação para `/admin/dashboard`.

## Notas

- Pequena melhoria de coerência (não obrigatória para o fix): trocar o label "Password" do `AdminLogin` para "Palavra-passe", em linha com o app. Posso incluir se quiseres.
