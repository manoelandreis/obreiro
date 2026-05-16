# Obreiro — Orçamentos Profissionais para Construção e Serviços

## Visão Geral

O **Obreiro** é uma ferramenta gratuita e online para criação de orçamentos profissionais, desenhada para profissionais de construção e serviços em Portugal.

**Problema que resolve:** substituir folhas de Excel, documentos Word ou orçamentos em papel por um fluxo digital, guiado e com aspeto profissional — sem necessidade de registo, instalação ou conhecimentos técnicos.

---

## Público-Alvo

| Segmento | Exemplos |
|----------|----------|
| **Profissionais independentes** | Canalizadores, eletricistas, pintores, carpinteiros, serralheiros, pedreiros |
| **Handymen / faz-tudo** | Prestadores de serviços domésticos multi-competência |
| **Pequenas empresas de construção** | Equipas de 1-10 pessoas em construção civil, remodelações, manutenção |
| **Mercado primário** | Portugal — interface em português, IVA a 23%, formato NIF português |

### Dores do público-alvo
- Perdem tempo a formatar orçamentos manualmente
- Enviam documentos pouco profissionais (emails de texto, fotos de rascunhos)
- Não têm software acessível — ERPs como Primavera ou PHC são complexos e caros
- Receio de partilhar dados em plataformas online

---

## Páginas da Aplicação

### Landing Page (`/`)
Página de apresentação do produto com foco em conversão (waitlist) e confiança (privacidade).

### Gerador de Orçamentos (`/quote`)
Ferramenta principal — fluxo de criação de orçamento em 4 passos guiados.

---

## Core Features

### 1. Fluxo de 4 Passos Guiado

O orçamento é construído progressivamente em 4 etapas, com navegação clara e validação por passo:

#### Step 1 — Dados da Empresa
- Nome da empresa
- NIF (Número de Identificação Fiscal)
- Email de contacto
- Telefone
- Morada completa
- Todos os campos são usados no cabeçalho do orçamento final

#### Step 2 — Dados do Cliente
- Nome do cliente
- Email do cliente (pré-preenche o campo de envio no Step 4)
- Telefone
- Morada
- Os dados aparecem no bloco "Cliente" do orçamento gerado

#### Step 3 — Serviços e Materiais
- Adicionar múltiplos serviços ao orçamento
- Cada serviço aceita materiais associados (modelo aninhado)
- Templates pré-definidos disponíveis para adição rápida
- Cálculos automáticos em tempo real
- Detalhes completos na secção seguinte

#### Step 4 — Preview e Entrega
- Visualização completa do orçamento formatado
- **Ação primária:** enviar por email (lead capture)
- **Ação secundária:** download direto em PDF
- Consentimento de comunicação obrigatório (RGPD)

---

### 2. Modelo de Dados Aninhado (Serviço → Materiais)

Cada orçamento segue uma estrutura hierárquica:

```
Orçamento
├── Serviço 1
│   ├── Nome e descrição do serviço
│   ├── Preço por hora + horas estimadas
│   ├── Material A (nome, qtd, unidade, preço unitário)
│   ├── Material B (nome, qtd, unidade, preço unitário)
│   └── ...N materiais
├── Serviço 2
│   ├── Nome e descrição
│   ├── Preço/hora + horas
│   └── Materiais associados...
└── ...N serviços
```

**Capacidades:**
- Não há limite de serviços por orçamento
- Não há limite de materiais por serviço
- Cada serviço calcula automaticamente: `subtotal mão de obra = preço/hora × horas`
- Cada material calcula: `subtotal material = quantidade × preço unitário`
- O subtotal do serviço é: mão de obra + soma de todos os materiais

---

### 3. Cálculo Automático de Preços

Todos os valores são calculados em tempo real enquanto o utilizador preenche:

| Cálculo | Fórmula |
|---------|---------|
| Mão de obra (por serviço) | `preço/hora × horas estimadas` |
| Material (por item) | `quantidade × preço unitário` |
| Subtotal serviço | `mão de obra + Σ materiais` |
| Subtotal geral | `Σ subtotais de todos os serviços` |
| IVA | `subtotal geral × 23%` |
| **Total final** | `subtotal geral + IVA` |

- Os subtotais de mão de obra e materiais são apresentados separadamente
- O IVA é fixo a 23% (taxa padrão portuguesa)
- Atualização instantânea — sem necessidade de clicar "calcular"

---

### 4. Sistema de Templates

Templates são materiais e serviços pré-definidos que aceleram a criação do orçamento:

**Estrutura de cada template:**
- Nome (ex: "Tubo PVC 32mm", "Tinta Acrílica Branca 15L")
- Categoria (ex: "Canalização", "Pintura", "Eletricidade")
- Unidade (ex: "metro", "litro", "unidade", "m²")
- Preço default (valor sugerido, editável pelo utilizador)
- Estado ativo/inativo

**Como funciona:**
1. No Step 3, o utilizador clica "Adicionar do Catálogo"
2. Vê uma lista de templates organizados por categoria
3. Seleciona um template — é adicionado como material ao serviço atual
4. Os valores (nome, unidade, preço) são pré-preenchidos mas editáveis
5. O utilizador ajusta quantidade e confirma

---

### 5. Preview Profissional do Orçamento

O Step 4 gera uma visualização completa e formatada do orçamento:

**Layout do documento:**
```
┌─────────────────────────────────────┐
│  LOGO / NOME DA EMPRESA             │
│  NIF · Email · Telefone · Morada    │
├─────────────────────────────────────┤
│  DADOS DO CLIENTE                    │
│  Nome · Email · Telefone · Morada   │
├─────────────────────────────────────┤
│  SERVIÇO 1: [Nome]                  │
│  Descrição do serviço               │
│  Mão de obra: Xh × €Y/h = €Z       │
│                                      │
│  Material  │ Qtd │ Un. │ €/Un │ Total│
│  ──────────┼─────┼─────┼──────┼──────│
│  Item A    │  5  │ m   │ 2.50 │12.50 │
│  Item B    │  2  │ un  │15.00 │30.00 │
│                                      │
│  Subtotal Serviço 1: €XXX.XX        │
├─────────────────────────────────────┤
│  SERVIÇO 2: [Nome]                  │
│  (mesma estrutura)                   │
├─────────────────────────────────────┤
│  RESUMO FINANCEIRO                   │
│  Subtotal Mão de Obra:    €XXX.XX   │
│  Subtotal Materiais:      €XXX.XX   │
│  Subtotal:                €XXX.XX   │
│  IVA (23%):               €XXX.XX   │
│  TOTAL:                   €XXX.XX   │
├─────────────────────────────────────┤
│  NOTAS / TERMOS E CONDIÇÕES         │
│  (campo de texto livre)              │
├─────────────────────────────────────┤
│  Gerado com Obreiro                │
└─────────────────────────────────────┘
```

**Características:**
- Layout profissional e limpo
- Tabelas formatadas com alinhamento de valores
- Resumo financeiro destacado
- Campo de notas para termos, condições de pagamento, validade, etc.
- Branding discreto "Gerado com Obreiro" no rodapé

---

### 6. Entrega Email-First (Lead Capture)

O Step 4 implementa uma estratégia de entrega que prioriza a captação de leads:

**Fluxo de entrega:**

```
┌──────────────────────────────────┐
│  📧 Enviar Orçamento por Email   │  ← AÇÃO PRIMÁRIA (botão destacado)
│  [email pré-preenchido do Step 2]│
│                                  │
│  ☑ Aceito receber comunicações   │  ← Checkbox RGPD obrigatório
│    da Obreiro sobre novidades  │
│    e funcionalidades.            │
│                                  │
│  [ Enviar para o meu email ]     │  ← Botão primário
├──────────────────────────────────┤
│  Ou descarregue diretamente:     │
│  [ Download PDF ]                │  ← AÇÃO SECUNDÁRIA (botão outline)
└──────────────────────────────────┘
```

**Regras de negócio:**
- O email vem pré-preenchido do Step 2 (dados do cliente)
- O checkbox de consentimento é **obrigatório** para submeter por email
- O lead (email + nome) é guardado na base de dados **apenas** se o consentimento for dado
- O download direto do PDF está sempre disponível, sem necessidade de email ou consentimento
- O PDF é gerado via funcionalidade print-to-PDF do browser

---

### 7. Privacidade e Segurança

O Obreiro foi desenhado com um modelo **privacy-first**:

| Princípio | Implementação |
|-----------|--------------|
| **Nada é guardado** | Os dados do orçamento (empresa, cliente, serviços, materiais) existem apenas no browser durante a sessão. Ao fechar a página, desaparecem. |
| **100% Privado** | Todo o processamento acontece client-side. Os dados do orçamento nunca são enviados para nenhum servidor. |
| **Sem rastreamento** | Não há cookies de tracking, pixels de terceiros, ou partilha de dados com terceiros. |
| **Analytics anónimos** | Apenas eventos de uso anónimos são registados (ex: "orçamento iniciado", "step 3 completo") para melhorar o produto. Sem dados pessoais. |

**O que é guardado no servidor:**
- Leads da waitlist (email + nome, com consentimento)
- Leads de email-first delivery (email, com consentimento RGPD)
- Logs anónimos de orçamentos (contagem de itens, valor total — sem dados de empresa/cliente)
- Templates do catálogo

**O que NÃO é guardado:**
- Dados da empresa do utilizador
- Dados dos clientes
- Conteúdo dos serviços e materiais
- O orçamento em si

---

## Landing Page — Componentes

| Secção | Descrição |
|--------|-----------|
| **Navbar** | Logo + links "Criar Orçamento" e "Admin" |
| **Hero** | Título principal + subtítulo + 2 CTAs (Criar Orçamento / Waitlist) + security pill |
| **Product Snapshots** | 2 cards lado a lado com mockups (orçamento gerado + ferramenta de criação) |
| **Privacy Strip** | 3 pilares com ícones: "Nada é guardado" · "100% Privado" · "Sem rastreamento" |
| **Feature Cards** | 4 cards em grid: Orçamentos Profissionais · Templates Reutilizáveis · Gestão Organizada · Impressione Clientes |
| **Sobre** | Secção com título, subtítulo e corpo de texto sobre o Obreiro |
| **Waitlist** | Formulário com nome + email sobre fundo primário |
| **Footer** | Copyright simples |

---

## Proposta de Valor vs. Concorrentes

| Critério | Obreiro | Excel/Word | ERPs (Primavera, PHC) | Outros SaaS |
|----------|-----------|------------|----------------------|-------------|
| **Preço** | Gratuito | Gratuito (com licença Office) | €50-200+/mês | €10-50/mês |
| **Registo necessário** | Não | N/A | Sim | Sim |
| **Língua portuguesa** | ✅ Nativo | Manual | ✅ | Varia |
| **IVA português** | ✅ Automático (23%) | Manual | ✅ | Varia |
| **Curva de aprendizagem** | Minutos | Moderada | Semanas | Horas |
| **Privacidade** | Dados não guardados | Local | Cloud (dados no servidor) | Cloud |
| **Aspeto profissional** | ✅ Template formatado | Depende do utilizador | ✅ | ✅ |
| **Mobile-friendly** | ✅ Responsivo | ❌ | Varia | Varia |
| **Foco no público** | Construção e serviços | Genérico | Genérico/enterprise | Genérico |

**Diferenciadores chave:**
1. **Zero fricção** — sem registo, sem instalação, sem configuração
2. **Privacy-first** — os dados nunca saem do browser do utilizador
3. **Foco vertical** — desenhado especificamente para profissionais de construção e serviços em Portugal
4. **Gratuito** — sem planos pagos, sem limites de orçamentos, sem funcionalidades bloqueadas

---

## Stack Técnico (Resumo)

- **Frontend:** React 18 SPA com TypeScript e Tailwind CSS
- **Dados de orçamento:** processados 100% client-side, sem persistência no servidor
- **Analytics:** eventos anónimos de uso guardados no backend
- **Templates:** geridos via painel admin e servidos da base de dados
- **PDF:** gerado via funcionalidade nativa de print-to-PDF do browser
