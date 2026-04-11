

# Nova Secção "App Em Breve" — Estilo Expandable (Cohere-like)

## O que vou construir

Uma nova secção na landing page entre "Features" e "About", com o formato visual da imagem de referência (Cohere): um layout split-screen com uma imagem/mockup à esquerda e uma lista de funcionalidades expandíveis à direita. Cada item expande para mostrar bullets com checkmarks. O conteudo vem do README-2.md anexado.

## Layout

```text
┌──────────────────────────────────────────────────┐
│  "A App que está a caminho."  (título centrado)  │
├────────────────────┬─────────────────────────────┤
│                    │  ─── Dashboard Inteligente   │
│   Mockup/Image     │  ✓ Métricas em Tempo Real   │
│   (placeholder)    │  ✓ Gráfico de Atividade     │
│                    │  ✓ Acesso Rápido             │
│                    │  ─── Gestão de Clientes      │
│                    │  ─── Controlo de Trabalhos   │
│                    │  ─── Gestão de Tarefas       │
│                    │  ─── Segurança de Elite      │
└────────────────────┴─────────────────────────────┘
```

## Funcionalidades expandíveis (do README-2.md)

1. **Dashboard Inteligente** — Métricas em Tempo Real, Gráfico de Atividade, Acesso Rápido
2. **Gestão de Clientes (RGPD Ready)** — Ficha de Cliente, Consentimento RGPD, Direito ao Esquecimento
3. **Controlo de Trabalhos e Orçamentos** — Estados de Fluxo, Histórico, Preview de Documentos
4. **Gestão de Tarefas Detalhada** — Atividades, Produtos/Materiais, Progresso Visual
5. **Segurança de Elite** — Lock Screen, Auto-Lock, Logs de Segurança, Bloqueio de Força Bruta

## Detalhes técnicos

- Usar `Collapsible` do shadcn/ui para o efeito expandir/colapsar
- Cada item tem uma linha colorida no topo (como na imagem de referência — cores diferentes por item)
- Checkmarks com ícone `CheckCircle2` do Lucide
- Imagem à esquerda: placeholder com fundo bege/warm como na imagem de referência
- Apenas o primeiro item começa expandido
- Secção inserida entre "Features" e "About" no `Index.tsx`

## Ficheiros alterados

- **src/pages/Index.tsx** — Adicionar a nova secção "App Em Breve" com os 5 itens expandíveis

