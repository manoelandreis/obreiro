# Logotipo da empresa — upload, recorte e utilização

Melhorar o bloco "Logotipo da empresa" em Definições > Marca para suportar logos reais (ícone, horizontal ou vertical), com recorte, fundo branco/transparente e limites claros — e garantir que orçamentos (link público e PDF) mostram o logo corretamente ou, na ausência dele, apenas o nome da empresa.

## 1. Upload com regras claras

- Formatos aceites: PNG, JPG, WEBP, SVG. Recusar outros com mensagem explícita.
- Tamanho máximo: 5MB (mantém-se), validado antes do upload com aviso do tamanho real do ficheiro.
- Dimensões mínimas recomendadas: 200px no lado maior; abaixo disso, aviso ("pode ficar desfocado no PDF") sem bloquear.
- Redimensionamento automático no browser antes do upload: lado maior limitado a 1000px, mantendo proporção (SVG passa intacto).
- Estados visuais: a carregar, erro, sucesso, ficheiro atual.

## 2. Recorte e fundo

Ao escolher um ficheiro abre um diálogo (Drawer em mobile, Dialog em desktop, seguindo o padrão do ClientFormSheet):

- Área de recorte com zoom e arrasto.
- Escolha de proporção: Quadrado (ícone), Horizontal (3:1) ou Vertical (1:2) — a app sugere automaticamente a que mais se aproxima da imagem original.
- Fundo: Transparente (PNG) ou Branco. Para JPG, transparente não está disponível e a opção fica desativada com explicação.
- Pré-visualização em tempo real de como fica no cabeçalho do orçamento.
- Botões: Cancelar / Aplicar. O recorte é gravado como PNG (ou mantém-se SVG sem recorte).

## 3. Tipo e orientação do logo

- Guardar, além do ficheiro, o tipo de logo: `icon` (quadrado), `horizontal` (com lettering) ou `vertical`.
- Guardar a altura máxima de render escolhida pelo utilizador (Pequeno 32px / Médio 44px / Grande 64px), com pré-visualização.
- Regras de render no cabeçalho dos orçamentos:
  - `icon`: logo à esquerda + nome da empresa ao lado (comportamento atual).
  - `horizontal`: logo sozinho, sem repetir o nome ao lado (o lettering já está no logo), altura conforme escolhido, largura livre.
  - `vertical`: logo em bloco à esquerda, nome por baixo apenas se o logo não tiver lettering.
- Sem logo: mostrar apenas o nome da empresa, com o tratamento tipográfico atual (cap-height trim), sem caixa vazia nem placeholder.

## 4. Onde se aplica

As mesmas regras passam a valer em três sítios, para ficarem consistentes:

- Cabeçalho do link público do orçamento.
- Pré-visualização do orçamento na app.
- PDF gerado.

## 5. Bloco na página de Marca

- Pré-visualização do logo numa moldura que reflete a orientação real (não sempre 96x96).
- Seletores de orientação e de altura, com pré-visualização do cabeçalho do orçamento por baixo.
- Ações: Substituir, Recortar novamente, Remover.
- Texto de ajuda atualizado: formatos, 5MB, dimensão mínima recomendada, nota sobre fundo transparente.

## Detalhes técnicos

- Novas colunas em `app_user_settings`: `logo_kind` (`icon` | `horizontal` | `vertical`), `logo_height` (int, default 44), `logo_bg` (`transparent` | `white`). Migração com defaults compatíveis com os registos existentes (`icon`, 44, `transparent`).
- Recorte feito no cliente com canvas (sem nova dependência pesada); reutilizar `react-easy-crop` se já estiver disponível, caso contrário implementar arrasto/zoom simples com canvas.
- Upload continua no bucket privado `company-assets`, com URL assinado; ficheiro antigo é removido após substituição.
- `get_public_quote` já injeta as definições de marca atuais — acrescentar os três campos novos ao payload para o link público e a edge function `get-quote-logo`.
- `src/lib/quotePdf.ts`: substituir a classe fixa `.logo { height:44px; width:44px }` por altura/largura derivadas de `logo_kind` e `logo_height`, e esconder o nome duplicado quando `logo_kind = horizontal`.
