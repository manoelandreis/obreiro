## Objetivo
Substituir o ícone "handyman" (Material Symbol branco dentro de caixa com gradiente laranja) pelo PNG `obreiro-logo.png` enviado, mantendo o `shadow-accent-glow` (sombra laranja) por baixo.

## Passos

1. **Upload do PNG como Lovable Asset**
   - `lovable-assets create --file /mnt/user-uploads/obreiro-logo.png --filename obreiro-logo.png > src/assets/obreiro-logo.png.asset.json`

2. **Substituir nas 4 ocorrências** (`rg handyman` confirmou):
   - `src/components/AppLayout.tsx:80-85` — sidebar desktop (36×36)
   - `src/components/AppLayout.tsx:156-161` — topbar mobile (28×28)
   - `src/pages/IndexV2.tsx:40-43` — landing nav (tamanho dinâmico)
   - `src/pages/PrivacyPolicy.tsx:12-15` — header (≈32px)

   Em cada uma:
   - Remover o gradiente `bg-gradient-to-br from-accent to-[hsl(27_92%_60%)]` e o `text-white` (o PNG já trás o fundo laranja).
   - Manter `rounded-[10px]` + `shadow-accent-glow` no wrapper para preservar o glow laranja.
   - Substituir o `<span class="material-symbols-outlined">handyman</span>` por `<img src={obreiroLogo.url} alt="Obreiro" className="w-full h-full object-contain" />`.

3. **Import** em cada ficheiro:
   ```ts
   import obreiroLogo from "@/assets/obreiro-logo.png.asset.json";
   ```

## Fora de scope
- Não mexer no favicon (`public/favicon.ico`) — pedir separadamente se necessário.
- Não mexer em `AdminLayout.tsx` nem nos PDFs (não usam este ícone).
