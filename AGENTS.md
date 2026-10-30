# Instruções permanentes para manutenção do Cross Mansões TV

Antes de criar ou alterar qualquer arte, layout, componente, tela ou JSON de treino:

1. Ler **`MANSOES_BRAND_STANDARD.md`** — fonte oficial de identidade visual, composição de pôsteres, paleta CrossFit/Hybrid Run, mascote, hierarquia e precisão dos treinos.
2. Ler **`QUALITY_GATE.md`** — testes exigidos antes de considerar qualquer alteração aprovada.
3. Preservar **exatamente** exercícios, cargas, tempos, scores, nomes das categorias, datas e todos os dados fornecidos.
4. Usar dados estruturados em JSON; renderizar textos em HTML/CSS, não dentro de ilustrações.
5. Priorizar leitura a distância, adequação à TV TCL e navegação por controle remoto.
6. Testar as interações principais e o encaixe de todos os textos, especialmente após alterações visuais.
7. Não declarar a versão publicada nem testada em produção sem verificar os resultados efetivos.

A identidade é **preto/vermelho/branco** para CrossFit e **preto/azul/branco** para Hybrid Run. Para dias com as duas modalidades, usar as duas cores de maneira disciplinada.

## Atualização do proprietário — TV como visualizador de artes
A orientação mais recente substitui a regra anterior de textos exclusivamente em HTML para as telas de treino: usar imagens horizontais completas, incluindo títulos, exercícios e números, como pôsteres. O HTML exibe a imagem inteira sem cortes e oferece navegação direta por setas e botões. Conferir cada texto da arte contra os dados JSON antes de publicar. Manter fallback HTML para treinos ainda sem arte.
