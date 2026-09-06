# Design System — Obreiro

This document maps every reusable UI block in the codebase to a Figma component name. The goal is a 1:1 source of truth: if a block exists in code, it has a named component and a matching Figma component.

For colors, spacing, typography and semantic tokens, see [`design-tokens.md`](./design-tokens.md).

---

## Naming rule

- **Container components** (layout + header + collapse behavior): named for what they do structurally.
  - Example: `CollapsibleSection`
- **Domain/content components** (a specific business block): named for what they represent.
  - Examples: `ClientSection`, `ServicesSection`, `PaymentSection`, `NotesSection`
- **App-level helpers**: prefixed with the app area or feature.
  - Examples: `QuoteStatusBadge`, `PaymentTermsCard`, `ClientFormSheet`
- **Primitive components** from shadcn/ui keep their original names.
  - Examples: `Button`, `Input`, `Select`, `Dialog`, `Card`

When in doubt, mirror the file name in Figma.

---

## Component inventory

### Layout / containers

| Code component | File | Figma component | Purpose |
|---|---|---|---|
| `CollapsibleSection` | `src/components/app/CollapsibleSection.tsx` | `Collapsible Section` | Card with icon + title + optional summary + chevron toggle. Reusable container. |
| `SectionHeader` | `src/components/app/SectionHeader.tsx` | `Section Header` | Non-collapsible icon chip + title + optional description. |
| `MobileSheetSelect` | `src/components/app/MobileSheetSelect.tsx` | `Mobile Sheet Select` | Bottom-sheet select for mobile. |
| `MobilePrimaryAction` | `src/components/app/MobilePrimaryAction.tsx` | `Mobile Primary Action` | Floating primary action bar on mobile. |

### Quote creation sections

| Code component | File | Figma component | Purpose |
|---|---|---|---|
| `ClientSection` | `src/components/app/quote-new/ClientSection.tsx` | `Client Section` | Client picker + new-client trigger + selected client summary. Uses `CollapsibleSection`. |
| `ServicesSection` | `src/components/app/quote-new/ServicesSection.tsx` | `Services Section` | Service rows, labour inputs, materials table, templates. Uses `CollapsibleSection`. |
| `PaymentSection` | `src/components/app/quote-new/PaymentSection.tsx` | `Payment Section` | Payment preset selector + preview + new-template dialog. Uses `CollapsibleSection`. |
| `NotesSection` | `src/components/app/quote-new/NotesSection.tsx` | `Notes Section` | Notes / terms textarea. Uses `CollapsibleSection`. |

### App helpers

| Code component | File | Figma component | Purpose |
|---|---|---|---|
| `ClientFormSheet` | `src/components/app/ClientFormSheet.tsx` | `Client Form Sheet` | Bottom sheet / dialog for creating a client. |
| `PaymentTermsCard` | `src/components/app/PaymentTermsCard.tsx` | `Payment Terms Card` | Compact payment-term display. |
| `QuoteStatusBadge` | `src/components/app/QuoteStatusBadge.tsx` | `Quote Status Badge` | Status badge for quotes. |
| `QuoteWorkView` | `src/components/app/QuoteWorkView.tsx` | `Quote Work View` | Work/task visualization. |
| `QuoteAttachments` | `src/components/app/QuoteAttachments.tsx` | `Quote Attachments` | Quote file attachments. |
| `FeatureGate` | `src/components/app/FeatureGate.tsx` | `Feature Gate` | Feature/plan gating wrapper. |
| `LogoEditor` | `src/components/app/LogoEditor.tsx` | `Logo Editor` | Logo upload, crop and settings. |
| `PasswordStrengthMeter` | `src/components/app/PasswordStrengthMeter.tsx` | `Password Strength Meter` | Password strength indicator. |

### shadcn/ui primitives

Keep using the existing primitive names in Figma:

- `Button` — `src/components/ui/button.tsx`
- `Card` — `src/components/ui/card.tsx`
- `Input` — `src/components/ui/input.tsx`
- `Textarea` — `src/components/ui/textarea.tsx`
- `Label` — `src/components/ui/label.tsx`
- `Select` — `src/components/ui/select.tsx`
- `Dialog` — `src/components/ui/dialog.tsx`
- `Drawer` — `src/components/ui/drawer.tsx`
- `Sheet` — `src/components/ui/sheet.tsx`
- `Accordion` — `src/components/ui/accordion.tsx`
- `Checkbox` — `src/components/ui/checkbox.tsx`
- `Badge` — `src/components/ui/badge.tsx`
- `Tabs` — `src/components/ui/tabs.tsx`
- `Table` — `src/components/ui/table.tsx`
- `Toast` / `Sonner` — `src/components/ui/sonner.tsx`

---

## Token cheat sheet for Figma

| Token | CSS variable | Light value | Dark value | Usage |
|---|---|---|---|---|
| Background | `--background` | `#F5F5F5` | `#0F141C` | Page background |
| Card | `--card` | `#FFFFFF` | `#131B26` | Card surfaces |
| Primary | `--primary` | `#E8730A` | `#E8730A` | CTAs, links, active states |
| Primary FG | `--primary-foreground` | `#FFFFFF` | `#FFFFFF` | Text on primary |
| Muted | `--muted` | `#ECEEF0` | `#1E2936` | Subtle backgrounds |
| Muted FG | `--muted-foreground` | `#555555` | `#9CA3AF` | Secondary text |
| Destructive | `--destructive` | `#D94B4B` | `#D94B4B` | Errors, delete |
| Success | `--success` | `#1F9D55` | `#1F9D55` | Accepted, done |
| Warning | `--warning` | `#E8A30A` approx | — | Warnings |
| Radius | `--radius` | `14px` | `14px` | Corner radius |
| Font heading | `Poppins` | — | — | Headings |
| Font body | `Inter` | — | — | Body text |

---

## How to keep parity

1. Before adding a new UI block, ask: *is this reusable?* If yes, extract it to `src/components/app/` with a PascalCase name.
2. Create or update the matching Figma component with the same name.
3. Add a row to this inventory.
4. Never hardcode colors or values in components — always use tokens from `src/index.css`.
