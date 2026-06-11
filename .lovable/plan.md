## Objectivo
Trocar o "O" do quadrado da logo por um ícone de ferramentas **handyman** (Material Symbols Outlined, preenchido a branco) e mudar o wordmark para **"Obreiro"** todo em preto bold (sem o "eiro" laranja).

## Alterações

1. **`index.html`** — adicionar a folha de estilos do Google Material Symbols:
   ```html
   <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,500,1,0" />
   ```

2. **`src/pages/IndexV2.tsx`** (componentes `LogoMark` e `WordMark`, linhas 35-50):
   - Substituir o texto "O" por:
     ```tsx
     <span className="material-symbols-outlined text-white" style={{ fontSize: size * 0.6 }}>handyman</span>
     ```
   - Manter o quadrado laranja (gradient + rounded + shadow).
   - Substituir `obr<span ...>eiro</span>` por simplesmente `Obreiro` com classes `font-heading font-bold text-foreground`.

3. **`src/pages/PrivacyPolicy.tsx`** (linhas 11-19): aplicar exactamente a mesma alteração à logo do header para consistência.

## Notas
- Não tocar em mais nada (admin/app mantêm o branding existente).
- O ícone é carregado via CDN do Google Fonts, sem dependências novas no projecto.
