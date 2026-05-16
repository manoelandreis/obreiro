
# Admin / Backoffice — Estado atual e o que falta

## O que já tens

| Módulo | Estado | Localização |
|---|---|---|
| Leads (waitlist) | ✅ Listagem | `/admin/leads` |
| Analytics do funil de orçamento | ✅ Eventos por step | `/admin/analytics` |
| Catálogo de templates | ✅ CRUD | `/admin/templates` |
| Landing CMS | ✅ Editar secções | `/admin/content` |
| Auth admin (role-based) | ✅ `user_roles` + `has_role` | — |

## O que falta para um "CRM completo" de gestão da tool

Dividido em 4 categorias. Para cada uma indico **se vale a pena construir dentro do Lovable** ou **usar uma ferramenta externa**.

### 1. Gestão de utilizadores e subscrições (CORE — construir)
Agora que tens `user_subscriptions` (Free/Pro/Business), precisas de:
- Lista de utilizadores com: email, tier, status, data registo, último login, nº orçamentos criados, MRR contribuído
- Ação manual: mudar tier (oferecer Pro grátis, dar trial, suspender)
- Ver subscrições prestes a expirar / canceladas
- Pesquisa por email/nome

**Porquê construir:** depende dos teus dados internos (subscriptions + auth) e ações precisam de escrever na BD. Nenhum SaaS externo faz isto sem integração custom pesada.

### 2. Métricas de negócio / SaaS (CORE — construir leve)
Dashboard com KPIs:
- MRR, ARR, churn rate, conversão Free→Pro
- Utilizadores ativos (DAU/WAU/MAU)
- Orçamentos criados por dia, taxa de aceite (status `aceite` / enviados)
- Top utilizadores por volume

**Porquê construir:** dados vivem no teu Supabase; uma página com queries agregadas resolve. Substituir por externo seria over-engineering.

### 3. Product analytics / behavior tracking (USAR EXTERNO ✅)
Para entender **como** os users usam a app (heatmaps, funnels avançados, retenção, session replay):

**Recomendação: PostHog (free tier generoso)**
- Funnels, retenção, session replay, feature flags, A/B tests
- Self-hosted ou cloud, GDPR-friendly (EU hosting)
- Substitui o que terias de construir manualmente em `quote_events`
- Free até 1M eventos/mês

Alternativas: Mixpanel (pago mais cedo), Plausible (só pageviews, mais simples).

**O que manter no teu admin:** o `AdminAnalytics` atual continua útil para o funil específico do gerador de orçamentos público (que é o teu lead magnet).

### 4. Suporte ao cliente & comunicação (USAR EXTERNO ✅)
- **Chat/help desk:** Crisp (free tier) ou Intercom (caro). Crisp é o mais usado por SaaS PT pequenos.
- **Email marketing / onboarding:** Resend (transacional, já compatível com Lovable) + Loops.so ou Customer.io para sequências.
- **Knowledge base:** Crisp inclui, ou usar Notion público.

**Não construir:** caixa de mensagens internas é trabalho enorme e mal feito vs. ferramentas dedicadas.

### 5. CRM de leads (DEPENDE)
Tens `waitlist_leads` simples. Para um CRM de vendas real (notas, tags, pipeline, follow-ups):

**Opção A — Manter simples no admin** (recomendado se vais lançar self-service):
- Adicionar: tags, notas, status (contactado/convertido), exportar CSV
- ~1 sprint de trabalho

**Opção B — Sincronizar com HubSpot Free / Pipedrive**:
- Edge function que envia novos leads via API
- HubSpot CRM é gratuito até 1M contactos
- Faz sentido se vais ter equipa de vendas a trabalhar leads ativamente

Como o teu produto é self-service B2B SMB, **Opção A chega**.

---

## Recomendação consolidada

**Construir no admin (Sprint próximo):**
1. **Gestão de utilizadores & subscrições** (lista, filtros, ações: mudar tier, suspender)
2. **Dashboard de KPIs SaaS** (MRR, churn, conversão, orçamentos)
3. **Enriquecer leads** (tags, notas, status, export CSV)

**Integrar (sem construir):**
4. **PostHog** — product analytics & session replay (substitui análise comportamental custom)
5. **Crisp** — chat de suporte + knowledge base (snippet no site)
6. **Resend + Loops.so** — emails transacionais e sequências de onboarding (já temos infra Resend pronta)

**Não construir nunca:**
- Sistema de tickets/chat próprio
- Email marketing engine
- Heatmaps / session replay

---

## Plano de execução proposto

```text
Sprint A — Admin: Users & Subscriptions
  - Tabela admin_users_view (query agregada: profiles + subs + counts)
  - Página /admin/users com filtros, search, ações
  - Edge function admin-update-subscription (mudar tier manualmente)

Sprint B — Admin: KPIs Dashboard
  - Página /admin/dashboard (substituir landing do /admin)
  - Cards: MRR estimado, users totais, ativos 30d, orçamentos enviados/aceites
  - Gráfico time-series (recharts) com novos signups e orçamentos

Sprint C — Leads CRM-lite
  - Adicionar campos a waitlist_leads: status, tags[], notes
  - UI com kanban simples ou tabela editável + export CSV

Sprint D — Integrações externas (snippets + docs)
  - PostHog: instalar SDK, identificar user, eventos-chave
  - Crisp: snippet no AppLayout (só authenticated)
  - Loops.so: webhook on signup (edge function)
```

## Pergunta antes de começar
Por onde queres começar?
- **(1)** Sprint A — Users & Subscriptions (mais útil para gerires utilizadores hoje)
- **(2)** Sprint B — KPIs Dashboard (visibilidade do negócio)
- **(3)** Integrar PostHog primeiro (sem isto, vais lançar às cegas)
- **(4)** Tudo pela ordem A→B→C→D
