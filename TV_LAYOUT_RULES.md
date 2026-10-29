# Regras de legibilidade e blocos — Cross Mansões TV

## Interpretação semântica do WOD

- **Um WOD sem divisões** é um único bloco. O conjunto de exercícios deve ser centralizado na área útil, desde que caiba.
- Dividir em blocos somente quando houver identificadores explícitos (`BLOCO 1`, `BLOCO A`, `ROUND 2`, etc.) **ou um parágrafo separando dois conjuntos de movimentos**.
- Parágrafos contendo apenas título, formato (`FOR TIME`, `EVERY`, `AMRAP`), `Score`, `Time Cap` e observações **não** criam blocos.
- A divisão `---PAGE---` de treinos legados é tratada como separação de parágrafo, nunca como exercício.
- Quando há múltiplos blocos, apresentá-los em painéis separados; caso não caibam, paginar respeitando fronteiras entre blocos.
- Não modificar volumes, cargas, categorias, ordens, cap ou score fornecidos.

## Tipografia e distância

Base de consulta: Android TV / Google, documentação de tipografia e layout de TV; Whale TV recomenda texto mínimo de 22 px aproximadamente a 3 metros. **Metas do box são maiores**, já que alunos podem estar mais distantes:

| Elemento | Meta Full HD (1920×1080) |
| --- | --- |
| Categoria RX+/RX/INT/SC/INI | 34–42 px |
| Descrição da adaptação | 28–34 px |
| Movimento no WOD | 30–38 px |
| Número do WOD | 52–76 px |

No layout de 1366×768, manter categorias **≥ 26 px** e descrições **≥ 22 px** em CSS, com maior preferência por abrir mais uma página antes de reduzir tamanhos.

**As metas são do projeto, não normas universais.** O teste físico a distância real do box continua necessário.

## Quality gate

- Teste unitário: WOD contínuo, separação por parágrafo, separação por `BLOCO`.
- Teste funcional (Chromium 1920×1080 e 1366×768): navegar via clique e controle, carregar ambos os treinos, confirmar duas páginas de adaptações Hybrid Run, confirmar tamanhos calculados e nenhum overflow.
- Publicar apenas após aprovação dos testes.

## Todas as etapas — 29/10/2026
Aplicar a identidade de pôster também a aquecimento, skill, adaptações, regras e accessory. Preservar blocos e parágrafos; centralizar conjuntos únicos e paginar quando necessário. Personagens e cenários podem ser imagens pesadas, conforme autorização do proprietário; textos permanecem precisos e legíveis. Setas esquerda/direita trocam a página diretamente, sem OK, inclusive com keyCode de controles antigos.

Arte `assets/tv-characters.png` criada com imagegen integrado. Prompt: painel duplo cinematográfico sem texto; gorila atlético inspirado em Zuko fazendo thruster em academia industrial preta/vermelha; Appa empurrando sled com iluminação azul; personagens contidos em cada metade, fumaça e textura grunge, sem números ou logos.

## Publicação autorizada
O proprietário autorizou em 29/10/2026 publicar automaticamente as próximas alterações deste aplicativo após os testes obrigatórios, sem nova confirmação. Verificar o resultado do deploy antes de anunciar publicação.
