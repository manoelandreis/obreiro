## Ajustes ao botão flutuante do link público de orçamento

### 1. Limitar o floating ao mobile
No `src/pages/PublicQuote.tsx`, o wrapper do botão flutuante vai receber `md:hidden` para deixar de aparecer em tablet/desktop. Em ecrãs md+ o botão original (laranja, dentro do fluxo) continua a ser o único CTA de descarregar.

### 2. Porque é que o refresh não mostrou a alteração
As alterações que fiz na resposta anterior só existem no ambiente de **preview** (`id-preview--...lovable.app`). O link partilhado do orçamento que testaste aponta para o site **publicado** (`obreiro.pt` / `obreiro.lovable.app`), que ainda serve a versão antiga — refresh, hard reload ou limpar cache não fazem diferença enquanto não fizermos deploy.

Para veres o botão laranja + floating no link real, tens duas opções:
- **Testar já no preview**: abrir o mesmo `/q/<token>` mas no domínio `id-preview--39feecc8-e8ad-4329-861f-6b760b3046a2.lovable.app` — funciona com o mesmo token.
- **Publicar**: depois de aprovares este plano e eu aplicar o `md:hidden`, publicamos o projecto e o link atual (`obreiro.pt/...`) passa a mostrar as três alterações (botão laranja, sem barra lateral no bloco de pagamento, floating só em mobile).

### Detalhes técnicos
- Alterar o `div` do floating em `PublicQuote.tsx` de `fixed bottom-4 inset-x-0 ...` para `fixed bottom-4 inset-x-0 md:hidden ...`.
- `IntersectionObserver` e restante lógica ficam iguais; em desktop o estado continua a ser calculado mas o container simplesmente não é renderizado visualmente.
- Não é preciso mexer em mais nada dos pontos 1 e 2 da mensagem anterior (botão laranja + remoção da barra lateral) — já estão corretos, só faltam ser publicados.
