

# README.md — Documentação Detalhada do Produto

## O que vou escrever

Um README completo focado no lado do cliente (sem CMS/admin), com detalhe suficiente para pesquisa de concorrentes.

## Estrutura do documento

### 1. Visão Geral
- O que é o HandyFlow: ferramenta gratuita de criação de orçamentos para profissionais de construção e serviços em Portugal
- Problema que resolve: substituir folhas Excel, Word ou papel por um fluxo digital profissional

### 2. Público-Alvo
- Construtores independentes, canalizadores, eletricistas, pintores, carpinteiros
- Pequenas empresas de construção civil (1-10 pessoas)
- Handymen e prestadores de serviços domésticos
- Mercado primário: Portugal (interface em PT, IVA 23%, formato NIF)

### 3. Páginas da Aplicação
- **Landing Page** (`/`) — apresentação do produto, features, privacy strip, waitlist
- **Gerador de Orçamentos** (`/quote`) — ferramenta principal com 4 passos

### 4. Core Features (detalhado)

**4.1 Fluxo de 4 Passos Guiado**
- Step 1: Dados da empresa (nome, NIF, email, telefone, morada)
- Step 2: Dados do cliente (nome, email, telefone, morada)
- Step 3: Serviços e materiais (modelo aninhado)
- Step 4: Preview + entrega (email-first com download secundário)

**4.2 Modelo de Dados Aninhado (Serviço → Materiais)**
- Cada serviço tem: nome, descrição, preço/hora, horas estimadas
- Cada serviço pode ter N materiais associados: nome, quantidade, unidade, preço unitário
- Subtotais automáticos por serviço (mão de obra + materiais)
- Possibilidade de adicionar múltiplos serviços por orçamento

**4.3 Cálculo Automático de Preços**
- Mão de obra: preço/hora × horas
- Materiais: quantidade × preço unitário
- Subtotais separados (mão de obra vs materiais)
- IVA automático a 23%
- Total final calculado em tempo real

**4.4 Sistema de Templates**
- Catálogo de materiais/serviços pré-definidos
- Templates com nome, unidade, preço default, categoria
- Adicionar template como material com 1 clique
- Geridos via admin (activar/desactivar)

**4.5 Preview Profissional do Orçamento**
- Layout formatado com header da empresa + dados do cliente
- Tabela de materiais por serviço com colunas (Material, Qtd, Unidade, Preço Unit., Total)
- Resumo financeiro detalhado
- Campo de notas/termos e condições
- Branding "Gerado com HandyFlow"

**4.6 Entrega Email-First (Lead Capture)**
- Ação primária: enviar orçamento por email (campo pré-preenchido do Step 2)
- Checkbox de consentimento de comunicação (RGPD)
- Lead guardado na BD só com consentimento
- Ação secundária: download direto do PDF (print-to-PDF via browser)

**4.7 Privacidade e Segurança**
- Processamento 100% no browser (client-side)
- Dados do orçamento não são persistidos no servidor
- Sem rastreamento de terceiros
- Dados desaparecem ao fechar a página

### 5. Landing Page Features
- Hero com CTA + security pill
- Product snapshots (2 mockups lado a lado)
- Privacy strip (3 pilares: nada guardado, 100% privado, sem rastreamento)
- Feature cards (4 cards em grid)
- Secção "Sobre"
- Formulário de waitlist com email + nome

### 6. Proposta de Valor vs Concorrentes
- Gratuito (sem planos pagos por enquanto)
- Sem registo necessário
- Focado no mercado PT (língua, IVA, NIF)
- Privacy-first (sem dados guardados)
- Fluxo simples vs ERPs complexos (Primavera, PHC, etc.)

### 7. Stack Técnico (breve)
- React SPA, Tailwind CSS, TypeScript
- Sem backend storage de dados de orçamento
- Analytics de uso anónimos apenas

## Ficheiros alterados
- `README.md` — reescrita completa

