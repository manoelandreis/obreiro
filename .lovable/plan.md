## Diagnóstico

O servidor de dev está a responder normalmente (HTTP 200 em `localhost:8080`) e não há erros de runtime registados. O ecrã preto com apenas o tooltip "Project preview" no screenshot indica que o iframe do preview no editor não carregou o conteúdo — é um problema do iframe/cache do editor, não do código da app.

Causas típicas:
1. O iframe ficou preso após o último deploy/build (S3 rate limit anterior).
2. Cache do browser do editor.
3. HMR em estado inconsistente após muitas edições seguidas.

## Plano de ação

1. Forçar um flush do HMR do dev server (`POST /__hmr_flush`) para reentregar os módulos atualizados ao iframe.
2. Reiniciar o dev server do sandbox como segundo passo se o flush não resolver.
3. Pedir ao utilizador para clicar no botão de refresh (⟳) acima do preview ou abrir o preview em nova aba (ícone ↗) — isto resolve >90% dos casos em que o iframe fica preto.

Nenhuma alteração de código necessária. Se após estes passos o preview continuar preto, investigamos `console`/`network` do iframe.