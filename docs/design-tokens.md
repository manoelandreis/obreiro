# Design Tokens — Obreiro

Todos os componentes do app, admin e landing usam **apenas** estes tokens semânticos.
Nunca uses cores tailwind diretas (`bg-emerald-50`, `text-blue-600`, etc.) nem HSL hardcoded em componentes.

Fonte da verdade: `src/index.css` (variáveis CSS) + `tailwind.config.ts` (mapeamento de classes).

---

## Paleta semântica

| Família | Sólido | Soft (fundo) | Soft FG (texto) | Quando usar |
|---|---|---|---|---|
| **primary** | `bg-primary` / `text-primary` | `bg-primary/10` | `text-primary` | Ações principais, marca, links, nav ativa |
| **accent** | `bg-accent` | `bg-accent-soft` | `text-accent-soft-foreground` | Realces secundários (mesma cor que primary atualmente) |
| **success** | `bg-success` | `bg-success-soft` | `text-success-soft-foreground` | Aceite, aprovado, consentimento, concluído |
| **warning** | `bg-warning` | `bg-warning-soft` | `text-warning-soft-foreground` | Avisos, em curso, pendente, ação requerida |
| **info** | `bg-info` | `bg-info-soft` | `text-info-soft-foreground` | Estado informativo, visto, enviado |
| **destructive** | `bg-destructive` | `bg-destructive-soft` | `text-destructive-soft-foreground` | Erros, rejeitado, apagar |
| **brand-dark** | `bg-brand-dark` / `text-brand-dark-foreground` | — | — | Accent escuro alternativo (resumo de orçamento, CTAs em fundo claro) |
| **muted** | `bg-muted` | — | `text-muted-foreground` | Estados neutros, rascunhos, placeholders |

Para texto/ícone sobre sólidos: `text-{family}-foreground` (ex: `text-success-foreground`).
Para borders subtis: `border-{family}/20` ou `border-{family}/30`.

---

## Botões

```tsx
// Primário (CTA)
<Button>Criar orçamento</Button>

// Secundário
<Button variant="outline">Cancelar</Button>

// Subtil
<Button variant="ghost">Fechar</Button>

// Destrutivo (apagar)
<Button variant="destructive">Apagar cliente</Button>

// Sucesso (raro — quando precisas dum CTA verde)
<Button className="bg-success text-success-foreground hover:bg-success/90">
  Marcar como aceite
</Button>
```

---

## Inputs

Os `<Input>`, `<Textarea>`, `<Select>` já usam tokens (`border-input`, `bg-background`, `ring-ring`).
Para estados:

```tsx
// Erro
<Input className="border-destructive focus-visible:ring-destructive" />
<p className="text-sm text-destructive mt-1">Email inválido</p>

// Sucesso
<Input className="border-success focus-visible:ring-success" />
```

---

## Badges

```tsx
// Estados de orçamento
<Badge className="bg-muted text-muted-foreground border-0">Rascunho</Badge>
<Badge className="bg-info-soft text-info-soft-foreground border-0">Enviado</Badge>
<Badge className="bg-warning-soft text-warning-soft-foreground border-0">Visto</Badge>
<Badge className="bg-success-soft text-success-soft-foreground border-0">Aceite</Badge>
<Badge className="bg-destructive-soft text-destructive-soft-foreground border-0">Rejeitado</Badge>

// Com border subtil (útil em outline)
<Badge variant="outline" className="bg-success-soft text-success-soft-foreground border-success/20">
  Consentimento ativo
</Badge>
```

Componente pronto: `src/components/app/QuoteStatusBadge.tsx`.

---

## Cards

```tsx
// Card neutro (default)
<Card>...</Card>

// Card de aviso
<Card className="border-warning/30 bg-warning-soft/60">
  <CardContent className="flex items-start gap-3 pt-6">
    <AlertTriangle className="h-5 w-5 text-warning-soft-foreground" />
    <div>
      <div className="font-semibold text-warning-soft-foreground">Dados em falta</div>
      <p className="text-sm text-warning-soft-foreground/90">…</p>
    </div>
  </CardContent>
</Card>

// Card de destaque (primário)
<Card className="border-primary/30 bg-primary/5">…</Card>

// Stat card com ícone tonalizado
<div className="h-10 w-10 rounded-xl bg-warning-soft flex items-center justify-center">
  <Clock className="h-5 w-5 text-warning-soft-foreground" />
</div>
```

---

## Links

```tsx
// Link inline
<a className="text-primary hover:underline">Ver mais</a>

// Link de navegação (ativo)
<NavLink className={({ isActive }) =>
  isActive
    ? 'bg-primary text-primary-foreground'
    : 'text-muted-foreground hover:bg-muted'
} />

// Link destrutivo
<button className="text-destructive hover:text-destructive hover:bg-destructive/5">
  Apagar conta
</button>
```

---

## States rápidos (cheat sheet)

| Estado | bg | text | border |
|---|---|---|---|
| Hover subtil | `hover:bg-muted` | — | — |
| Focus | — | — | `focus-visible:ring-ring` |
| Disabled | — | `text-muted-foreground` | `opacity-50` |
| Selected (item) | `bg-primary/10` | `text-primary` | `border-primary/20` |
| Pill ativa | `bg-primary` | `text-primary-foreground` | — |

---

## Regras

1. **Nunca** uses `bg-emerald-*`, `text-blue-*`, `bg-amber-*`, `#hex`, `hsl(…)` em componentes.
2. Para cores novas, adiciona um token em `src/index.css` + `tailwind.config.ts` antes de usar.
3. Para opacidades, prefere `bg-primary/10` em vez de criar uma variável nova.
4. Texto sobre fundos `soft` → usa o `*-soft-foreground` correspondente (contraste já garantido).
5. Modo escuro: tokens já adaptam automaticamente via `.dark` em `index.css`.
