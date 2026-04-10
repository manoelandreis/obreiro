

# Plano: Landing Page + Quote Generator + Backoffice (Projeto Único)

Tudo no mesmo projeto. Rotas públicas (`/`, `/quote`) sem login. Rotas admin (`/admin/*`) protegidas por autenticação. Mesma base de dados Supabase.

## Estrutura de Rotas

```text
/                → Landing page (pública)
/quote           → Quote generator (público)
/admin           → Login do backoffice
/admin/leads     → Gerir emails/waitlist
/admin/content   → Editar textos da landing
/admin/templates → Gerir templates de orçamentos
/admin/analytics → Ver métricas
/app/*           → App completo (redirect → / por agora)
```

## Base de Dados (Lovable Cloud)

| Tabela | Acesso público | Acesso admin |
|--------|---------------|-------------|
| `waitlist_leads` | Insert | Select, Export |
| `landing_content` | Select | Update |
| `quote_templates` | Select | CRUD |
| `quote_logs` | Insert | Select |
| `profiles` | — | Próprio user |

RLS em todas as tabelas. Admin identificado por role na tabela `user_roles`.

## Implementação

### 1. Lovable Cloud + Auth + Schema
- Ativar Cloud, criar tabelas e RLS
- Auth apenas para backoffice (email/senha)
- Tabela `user_roles` para identificar admin

### 2. Landing Page
- Hero, features, about section, waitlist form
- Textos carregados de `landing_content` (editáveis no backoffice)

### 3. Quote Generator (`/quote`)
- Multi-step: dados empresa → dados cliente → linhas do orçamento → preview
- Templates pré-carregados de `quote_templates`
- PDF gerado client-side
- Nudge opcional para waitlist no final

### 4. Backoffice (`/admin/*`)
- Protegido por login + role admin
- Leads: lista + export CSV
- Content: editar textos da landing
- Templates: CRUD de serviços/preços
- Analytics: contadores e gráficos simples (Recharts)

### 5. App Futuro (`/app/*`)
- Rotas existem mas redirecionam para `/`
- Desbloquear quando quiser lançar

## Porquê tudo junto

- Uma só base de dados, sem duplicação
- Backoffice acede directamente às mesmas tabelas que a landing page usa
- Menos complexidade para manter
- Separação feita por rotas protegidas, não por projetos

