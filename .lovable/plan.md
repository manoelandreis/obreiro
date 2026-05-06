## Remover "Passo a passo" da landing

Remover os dois links que apontam para `/quote` (a página de orçamento passo a passo) na landing page `src/pages/IndexV2.tsx`:

1. **Menu de navegação (linha 219)** — remover o `<Link to="/quote">Passo a passo</Link>` no nav superior.
2. **Footer — coluna Produto (linha 721)** — remover o `<li>` com o link "Passo a passo".

A rota `/quote` em si fica intacta (continua acessível directamente por URL), apenas deixa de ser promovida na landing. Se quiseres remover completamente a rota e a página, diz e eu acrescento ao plano.

Nada mais é alterado: hero, builder inline, secções de funcionalidades, waitlist e restantes links continuam iguais.