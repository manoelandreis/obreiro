# Component naming standard — codebase ↔ Figma 1:1

## Why
That section is not the shadcn Accordion. Today three different patterns coexist:

| Pattern | Where used | Named? |
|---|---|---|
| Hand-rolled `Card` + button + chevron toggle (local `expanded` state) | `AppQuoteNew.tsx` (Cliente, Serviços e Materiais, Pagamento, Notas) | No — inline JSX |
| shadcn `Accordion` | `IndexV2.tsx`, `AppHelp.tsx` | Yes (`Accordion`) |
| `SectionHeader` (icon chip + title, non-collapsible) | app pages | Yes |

Because the collapsible card is anonymous inline markup, it can't be mirrored as a single Figma component — hence the missing name.

## What to build

### 1. Shared container: `CollapsibleSection`
New `src/components/app/CollapsibleSection.tsx` capturing exactly the current AppQuoteNew look and behavior:
- Card container, header row with icon + title + optional right-side summary (e.g. client name, subtotal), chevron up/down
- Props: `icon`, `title`, `summary?`, `defaultOpen?`, `children`
- Controlled or uncontrolled open state
- Visual output stays pixel-identical to today — no design change

### 2. Content components (one per domain block)
Move the inner content of each AppQuoteNew section into its own named component in `src/components/app/quote-new/`:
- `ClientSection` — existing client select + summary
- `ServicesSection` — service rows + materials
- `PaymentSection` — payment terms / installments
- `NotesSection` — validity, notes, conditions

Each component wraps its content with `<CollapsibleSection>` and exposes props for data + callbacks only. This is what you recreate in Figma as `Client Section`, `Services Section`, etc.

### 3. Migrate AppQuoteNew to use these components
Replace the 4 inline card-toggle blocks in `AppQuoteNew.tsx` with the new content components. The page becomes a thin orchestrator: state + submit + layout.

### 4. Component inventory doc for Figma parity
New `docs/design-system.md` — the naming contract between codebase and Figma:
- Canonical component names and their variants: `Button`, `Card`, `CollapsibleSection`, `ClientSection`, `ServicesSection`, `PaymentSection`, `NotesSection`, `SectionHeader`, `MobileSheetSelect`, `ClientFormSheet`, `PaymentTermsCard`, `QuoteStatusBadge`, `MobilePrimaryAction`, shadcn primitives (`Input`, `Select`, `Dialog`, `Drawer`, `Accordion`…)
- For each: file path, props/variants, and which design tokens it uses
- Token list from `src/index.css` (colors, radius, fonts) with hex values so Figma styles match 1:1
- Naming rule going forward: every reusable visual block gets a named component in `src/components/app/`, and the Figma component uses the same name

## Not in scope
- No visual redesign — the goal is naming/structure parity, not changing how anything looks
- Not touching the public landing page (`IndexV2`) or PDF renderer
- No Figma sync automation — the doc is the manual source of truth

## Verification
- Build passes, `/app/quotes/new` renders and behaves identically (expand/collapse, summaries, validation)
- Quick Playwright check of the quote form before/after
