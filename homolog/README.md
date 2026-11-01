# Homologação — cadastro sem deploy de treino

Endereço: https://agelgustavo.github.io/cross-mansoes-tv/homolog/

Produção e homologação usam o mesmo visualizador e editor. Os catálogos, rascunhos e caches ficam separados nas branches `workout-content-production` e `workout-content-homolog`; alterações de conteúdo não disparam deploy de Pages. Promoção autorizada pelo proprietário em 01/11/2026.

## Uso

1. No calendário do ambiente desejado, use o `+` do dia.
2. Escolha CrossFit ou Hybrid Run. Adicione páginas, títulos livres e arquivos. Mude a ordem com as setas.
3. A imagem é exibida imediatamente. Documentos passam por uma fila; use **Usar resultado na prévia** quando terminar.
4. **Salvar rascunho** guarda no GitHub sem disponibilizar na TV. Uma cópia local também é guardada em IndexedDB.
5. Confira as páginas no painel lateral ou **Preview**, marque a confirmação e aprove. Apenas o ambiente em que você está editando passa a ler o novo conteúdo.
6. Na TV, volte ao calendário ou use Atualizar. O calendário também atualiza a cada minuto; uma aula aberta não muda sozinha.

## Acesso para edição (uma conexão por aba)

Crie um token fine-grained do GitHub restrito a este repositório, com **Contents: read/write** e **Actions: read/write**. Insira em **Conectar GitHub**. Não é a chave da OpenAI. O token é mantido somente na memória da aba e removido em Sair ou ao recarregar. TVs não precisam de token para ler.

O token não deve ser colocado em código, URL, arquivo, localStorage ou segredo de front-end. GitHub Pages não fornece autenticação de servidor; uma futura migração para login de equipe exige um backend de autenticação. O repositório é público: rascunhos e arquivos da branch também são públicos. Não carregar dados pessoais de alunos.

## Biblioteca central

- `media/<sha256>.png`: imagens finais imutáveis e reutilizáveis; a mesma imagem não é duplicada.
- `sources/<sha256>.<ext>`: originais de documentos.
- `drafts/AAAA-MM-DD-modalidade.json`: rascunhos.
- `jobs/<uuid>.json`: pedidos e resultados da conversão/IA.
- `catalog.json`: somente snapshots aprovados, por data/modalidade.
- `capabilities.json`: disponibilidade da geração por IA, sem qualquer segredo.

Cada arquivo é tecnicamente um blob Git imutável. A biblioteca e o catálogo fazem a associação às páginas, evitando um repositório ou armazenamento separado por página. Remover página não apaga o arquivo compartilhado. O histórico Git permite recuperação; não há coleta destrutiva automática.

Conteúdo usa a API GitHub e leitura pública do raw; não aciona `pages.yml`. A criação/atualização do catálogo usa SHA e revisão de treino para detectar edições concorrentes.

## Formatos e conversão

Imagens comuns são normalizadas no navegador para PNG (máximo 3840×2160, proporção preservada). PNG, JPEG, WebP, GIF (primeiro frame), BMP e AVIF têm prévia imediata quando suportados pelo navegador. TIFF, HEIC/HEIF, SVG, PDF, HTML, DOC/DOCX, ODT, RTF, TXT, Markdown, PPT/PPTX/ODP e XLS/XLSX/ODS usam conversão isolada. Até 25 MB por arquivo e 30 páginas por treino. Formatos desconhecidos, documentos corrompidos ou protegidos por senha retornam erro explícito.

O conversor preserva páginas, ordem e conteúdo; documentos retrato permanecem inteiros, sem cortes. O Preview é obrigatório para avaliar a legibilidade — uma página densa de texto pode exigir divisão no documento original. HTML precisa ser autocontido (estilos inline e imagens data URI); scripts, fontes remotas e recursos externos não são executados/carregados. Impressão usa paginação, não cortes arbitrários por screenshot.

O workflow `process-workout.yml` roda sob demanda; Docker sem rede, sem tokens e com recursos limitados converte os arquivos. Originais nunca são executados no navegador da TV. Resultados apenas atualizam o pedido, nunca o catálogo. Falhas no workflow antes do processamento podem ser diagnosticadas em Actions; **Reenviar processamento** retoma pedidos que não iniciaram. Pedidos já iniciados não são gerados novamente automaticamente, evitando cobrança duplicada.

## IA (preparada, não ativada sem chave)

O proprietário pode cadastrar `OPENAI_API_KEY` em Settings → Secrets and variables → Actions. Opcional: variável `OPENAI_IMAGE_MODEL` (padrão `gpt-image-2`). Na página, clique **Verificar ativação da IA** e aguarde. A chave só é entregue ao runner; não vai ao navegador nem ao conversor.

A geração recebe o padrão de marca, modalidade, título, treino e prompt. O resultado é rascunho. Conferir texto e números é indispensável antes de aprovar. Não foi feita chamada paga durante a implementação sem chave. O uso é cobrado pela API OpenAI, separado da assinatura de chat.

Documentação: https://developers.openai.com/api/reference/resources/images/methods/generate
GitHub: https://docs.github.com/en/rest/actions/workflows e https://docs.github.com/en/rest/git/blobs

## Testes e promoção

`npm run test:all`: testes originais + modelo, cadastro, preview, biblioteca, rascunhos, conflitos, isolamento de HTML e aprovação. `content-test` no GitHub constrói o conversor real e exercita os formatos com rede desabilitada; o deploy depende de ambos os jobs.

A integração de UI usa API simulada determinística; validação publicada confirma páginas reais e catálogo. Testes não representam geração de imagem real sem chave nem certificação de todo arquivo possível. Não promover `/homolog` para a raiz sem pedido explícito do proprietário. Antes de promover, rever autenticação, tempo/limites do GitHub e cópia de conteúdo aprovada. Produção e homologação não compartilham catálogo mutável nem cache local.
