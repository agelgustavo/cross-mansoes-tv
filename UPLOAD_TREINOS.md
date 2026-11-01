# Envio econômico de artes prontas

Produção: workout-content-production. Homologação: workout-content-homolog.
As páginas aprovadas ficam em catalog.json; imagens em media/<SHA256>.png.
Alterar essas branches não faz deploy. O calendário recarrega o catálogo; uma aula aberta permanece estável até Atualizar.

## Procedimento para o assistente
1. Ler AGENTS.md, padrão de marca e quality gate. Conferir data, modalidade, ordem e textos. Não recriar imagens prontas.
2. Ler os catálogos e seus commits atuais. Preservar todos os demais treinos.
3. Transferir cada arquivo inteiro uma vez: node_repl lê com fs.readFile e retorna a string base64 usando nodeRepl.write(string). Dentro de functions.exec, passar diretamente result.content[0].text a github_create_blob (encoding base64). Nunca imprimir o base64 no contexto. Não dividir em dezenas de chamadas.
4. Conferir SHA Git contra git hash-object local; SHA256 dá o caminho media. Reutilizar o mesmo blob nas duas branches, quando solicitado.
5. Criar catálogo atualizado com date, mode, title, revision, approvedAt, approvedBy e pages (id, title, path, text). Preservar revisão anterior ao editar e verificar concorrência.
6. Criar árvore e commit; mover cada ref com expected_sha. Não mudar main para uploads rotineiros.
7. Verificar catálogo público, hashes das imagens e navegação real nas duas resoluções. Só então informar publicação.

Para editar pelo app: calendário → + → páginas/títulos/imagens → Salvar rascunho → Preview → conferir → Aprovar.
O token GitHub fica na memória da aba. A chave OpenAI não é necessária para artes já prontas.
