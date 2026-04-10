

# Plano: Recriar HandyFlow com Lovable Cloud

## Resumo

Recriar o HandyFlow — uma plataforma de gestão para profissionais de serviços — com autenticação real, banco de dados Supabase (Lovable Cloud), e todas as funcionalidades descritas no README: Dashboard, Gestão de Clientes (RGPD), Trabalhos/Orçamentos, Tarefas, e Segurança.

---

## Arquitetura

```text
┌─────────────────────────────────────────┐
│              Frontend (React)           │
│  ┌───────┐ ┌────────┐ ┌─────────────┐  │
│  │ Auth  │ │Dashboard│ │  Clientes   │  │
│  │ Pages │ │  Page   │ │  CRUD+RGPD  │  │
│  └───────┘ └────────┘ └─────────────┘  │
│  ┌───────────┐ ┌──────────────────┐    │
│  │ Trabalhos │ │ Tarefas/Materiais│    │
│  │Orçamentos │ │   por Trabalho   │    │
│  └───────────┘ └──────────────────┘    │
└───────────────┬─────────────────────────┘
                │ Supabase Client
┌───────────────▼─────────────────────────┐
│          Lovable Cloud (Supabase)       │
│  Auth + profiles + clients + jobs +    │
│  tasks + materials + security_logs     │
│  RLS por user_id em todas as tabelas   │
└─────────────────────────────────────────┘
```

---

## Etapas de Implementação

### 1. Configurar Lovable Cloud e Autenticação
- Ativar Lovable Cloud com autenticação por email/senha
- Criar tabela `profiles` (nome, empresa, telefone) com trigger automático
- Criar página de Login e Registo

### 2. Criar Esquema de Base de Dados
Tabelas com RLS (cada utilizador só vê os seus dados):

- **clients** — nome, email, telefone, morada, notas, gdpr_consent (bool), gdpr_consent_date, user_id
- **jobs** — título, descrição, status (enum: quote/approved/in_progress/completed), preço, data_início, data_fim, client_id, user_id
- **tasks** — descrição, concluída (bool), job_id, user_id
- **materials** — nome, quantidade, unidade, job_id, user_id
- **security_logs** — evento, detalhes, timestamp, user_id

### 3. Dashboard Inteligente
- Métricas: total de trabalhos em curso, tarefas pendentes hoje
- Gráfico semanal de atividade (Recharts)
- Atalhos rápidos para criar orçamento/serviço

### 4. Gestão de Clientes (RGPD)
- CRUD completo de clientes
- Campo de consentimento RGPD com data
- Botão "Direito ao Esquecimento" — elimina permanentemente todos os dados do cliente (cliente + trabalhos + tarefas + materiais associados)
- Pesquisa e filtros

### 5. Trabalhos e Orçamentos
- CRUD com estados: Orçamento → Aprovado → Em Curso → Concluído
- Associação a cliente
- Preview/detalhes do trabalho com preço e datas
- Filtros por estado

### 6. Tarefas e Materiais por Trabalho
- Checklist de atividades por trabalho (marcar concluído)
- Lista de materiais necessários
- Barra de progresso visual

### 7. Navegação e Layout
- Sidebar responsiva com navegação: Dashboard, Clientes, Trabalhos
- Header com nome do utilizador e logout
- Design profissional com Tailwind — cores em tons de azul/cinza para transmitir confiança

### 8. Segurança e Logs
- Registar eventos de login/logout na tabela security_logs
- Página de logs de segurança visível pelo utilizador
- Proteção de rotas (redirect para login se não autenticado)

---

## Detalhes Técnicos

- **Gráficos**: Recharts (já compatível com o projeto)
- **Ícones**: Lucide React (já instalado)
- **RLS**: Todas as tabelas com `WHERE user_id = auth.uid()`
- **Cascade delete**: Eliminar cliente → elimina jobs → tasks → materials (RGPD)
- **Sem PIN/Lock Screen local**: Substituído por autenticação real com sessão Supabase (mais seguro que PIN em localStorage)

---

## Notas

- O repositório GitHub não continha código-fonte, apenas README — o app será recriado do zero
- LocalStorage será substituído por Lovable Cloud (Supabase) conforme escolhido
- O PIN de 4 dígitos do original é substituído por autenticação real (email/senha), que é mais seguro

