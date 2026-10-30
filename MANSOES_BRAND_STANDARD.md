# Mansões Crosstraining — Padrão Oficial de Artes e HTML

> Fonte: orientações fornecidas pelo proprietário em 29/10/2026. Este é o padrão geral para artes individuais, artes semanais e apresentações HTML dos treinos do Mansões Crosstraining.
>
> **Regra máxima:** preservar exatamente todos os dados fornecidos e priorizar legibilidade.

## 1. Direção de arte

Criar pôsteres esportivos premium, estética CrossFit / functional fitness, visual **grunge, cinematográfico, alto contraste**, fundo predominantemente preto, texturas industriais de academia, concreto e metal, tipografia pesada e distressed, iluminação dramática, fumaça, poeira e respingos de tinta.

A **prioridade absoluta é legibilidade**. Decoração nunca pode competir com a informação.

### Paletas oficiais

- **CrossFit:** preto + vermelho + branco.
- **Hybrid Run:** preto + azul + branco.
- **CrossFit + Hybrid Run no mesmo dia:** vermelho e azul usados de forma clara e organizada, sem mistura aleatória.

## 2. Personagem e mascote

- Mascote principal: **gorila atlético, forte e funcional**, não excessivamente bodybuilder.
- Com tema ou personagem, criar uma versão **original de gorila inspirada na referência**, especialmente roupa, cabelo, acessórios, postura, expressão e elementos visuais.
- O gorila deve estar relacionado ao treino do dia, preferencialmente executando ou contextualizando movimentos principais; **nunca apenas parado sem relação com o WOD**.
- Quando fizer sentido, podem existir dois ou três personagens na cena.
- Em artes individuais, o gorila deve ocupar aproximadamente **35% a 45%** da composição, sem atrapalhar os blocos de informação.
- Integrar a marca **Mansões Crosstraining** naturalmente em camiseta, regata, shorts, faixa, equipamento ou cenário.

## 3. Hierarquia visual obrigatória

1. Nome do WOD ou personagem/tema.
2. Estrutura principal do workout.
3. Workout principal.
4. Time Cap e Score.
5. Adaptações.
6. Regras ou observações.
7. Strength / Skill ou Optional Accessory.
8. Branding Mansões.

O nome do WOD deve ser grande e impactante. Exemplos: **AANG, ZUKO, MY WAY, SUSPICIOUS MINDS, BURNING LOVE**.

Mostrar o formato logo abaixo ou próximo ao título. Exemplos:

- FOR TIME
- AMRAP 20'
- EMOM 15'
- EVERY 3:00 x 6 SETS
- PARTNER WOD

Movimentos principais em lista clara, com números grandes para reps, metros e calorias. Exemplo:

    4 Burpee Over the Bar
    3 Power Cleans
    3 Front Squats
    3 Push Jerks

## 4. Ícones monocromáticos

Usar ícones **simples, consistentes e monocromáticos**, sempre relevantes.

| Categoria | Biblioteca visual sugerida |
| --- | --- |
| Cardio | Run, Row, Bike, Ski, Shuttle Run |
| Gymnastics | Pull-Up, Chest-to-Bar, Bar Muscle-Up, Ring Muscle-Up, Toes-to-Bar, HSPU, Wall Walk, Handstand Walk, Rope Climb |
| Weightlifting | Barbell, Deadlift, Clean, Snatch, Front Squat, Back Squat, Thruster, Jerk, Overhead Squat |
| Dumbbell / Kettlebell | Dumbbell, Kettlebell, Farmer Carry, Lunge, Devil Press |
| Outros | Box, Wall Ball, Burpee, Jump Rope, Timer, Trophy, Team, Warning |

## 5. Adaptações

Quando existirem, seguir **exatamente esta ordem**:

1. RX+
2. RX
3. INT
4. SC
5. INI

Exemplo visual:

    RUN
    RX+: 400 m
    RX: 400 m
    INT: 400 m
    SC: 300 m
    INI: 200 m

**Não aplicar cores diferentes por categoria.** Manter a paleta principal do pôster. Preservar os nomes das categorias enviados pelo usuário; não adicionar categorias ausentes.

## 6. Time Cap, Score e regras

**Time Cap** e **Score** devem funcionar como cards de KPI com destaque visual.

Exemplo:

    TIME CAP
    45'

    SCORE
    Tempo total

Para regras de segurança, usar um bloco visual separado, com **ícone de alerta** e destaque forte.

Exemplo:

    EVA OBRIGATÓRIO
    O Dumbbell não pode ser solto ou arremessado no chão.

## 7. Composição de pôster individual

**Topo:** Logo Mansões + nome do WOD + personagem.

**Corpo:** Strength / Skill (se existir), workout principal, personagem integrado à cena, Cap e Score.

**Parte inferior:** Adaptações, regras, Optional Accessory e branding.

Esta é uma sugestão, **não uma posição rígida**. A composição pode variar para aproveitar melhor o espaço, preservando hierarquia e legibilidade.

## 8. Artes semanais

- Formato **horizontal 16:9**, com **sete cards verticais lado a lado**, de segunda a domingo.
- Título: **PROGRAMAÇÃO DA SEMANA**.
- Cada card contém **apenas**: dia da semana, data, nome principal da programação, imagem relacionada e modalidade.
- **Não incluir** repetições, cargas nem detalhes do WOD na arte semanal.
- Dias CrossFit predominantemente **vermelhos**.
- Dias Hybrid Run **azuis**.
- Dias CrossFit + Hybrid Run combinam **vermelho e azul**.
- Fundo preto, textura grunge, alto contraste, tipografia esportiva grande, cards bem separados, gorilas em poses ligadas aos movimentos e branding Mansões Crosstraining.

Exemplos de cards semanais:

    SEGUNDA-FEIRA
    26/10
    BACK SQUAT
    CROSSFIT

    TERÇA-FEIRA
    27/10
    WALL WALK & PULL
    CROSSFIT + HYBRID RUN

    DOMINGO
    01/11
    HYBRID RUN
    HYBRID RUN

Frases permitidas no rodapé, conforme composição:

- TREINE COM PROPÓSITO
- FAÇA PARTE DA COMUNIDADE
- SEJA SUA MELHOR VERSÃO

## 9. O que evitar

- Texto pequeno demais.
- Excesso de decoração.
- Ícones aleatórios.
- Personagem bloqueando informações.
- Elementos atrás de textos.
- Informações repetidas.
- Inventar exercícios.
- Inventar cargas.
- Alterar números enviados.
- Alterar nomes de categorias.
- Alterar datas.

**Sempre preservar exatamente os dados fornecidos pelo usuário.**

## 10. HTML: arquitetura por componentes

**HTML deve tratar o conteúdo como componentes, nunca como uma única imagem rasterizada.**

Componentes sugeridos:

- WorkoutHeader
- WorkoutMain
- StrengthSkill
- AdaptationsGrid
- RulesPanel
- AccessoryPanel
- ScoreCard
- CapCard
- CharacterPanel
- BrandFooter

Usar **JSON intermediário** para representar o treino antes da renderização.

Exemplo de representação:

    {
      "theme": {
        "sport": "crossfit",
        "color": "red",
        "character": "Aang",
        "universe": "Avatar"
      },
      "workout": {
        "title": "Aang",
        "subtitle": "Death by Macho Man",
        "format": "EMOM",
        "duration": "15'",
        "score": "Carga utilizada × minutos completos"
      },
      "strength": {
        "title": "Back Squat"
      },
      "rules": [],
      "accessory": {}
    }

Arquitetura:

    Dados do treino
        ↓
    JSON estruturado
        ↓
    Template HTML/CSS
        ↓
    Textos, cards, tabelas e ícones
        ↓
    Imagem gerada apenas para personagem e background

**Não colocar textos importantes dentro de imagem gerada por IA.** A imagem gerada serve apenas ao personagem e cenário; todos os textos devem ser HTML/CSS, garantindo precisão, responsividade e edição.

Exemplo de prompt visual somente para personagem/background:

> Criar uma imagem premium para pôster do Mansões Crosstraining. Gorila atlético inspirado visualmente no conceito de Zuko, com penteado, cicatriz visual, roupas esportivas em vermelho/preto/dourado, expressão intensa, realizando Thruster em um box de CrossFit industrial. Fundo preto e vermelho, iluminação cinematográfica, fumaça e partículas. Composição deixando espaço limpo à direita para inserção de textos em HTML. Não inserir texto na imagem.

## 11. Legibilidade e qualidade do app de TV

O HTML de TV deve respeitar este padrão visual, sem sacrificar a eficiência:

- Priorização absoluta da informação do treino e leitura a distância.
- Cabeçalho/branding e rodapé reduzidos durante a exibição das aulas.
- Distribuição inteligente dos componentes pela esquerda e direita, com paginação quando necessário.
- Comprovar que os textos cabem sem cortar, sobrepor ou extrapolar a tela.
- Navegação funcional por controle remoto TCL, teclado e clique.
- Verificações obrigatórias de teste unitário, funcional e visual antes de publicar.
- Seguir também o documento `QUALITY_GATE.md` do repositório.

## 12. Regras finais de interpretação

- Todos os exemplos são exemplos, **não instruções para inserir conteúdo em treinos futuros**.
- Nunca inferir ou alterar dados faltantes sem confirmação; se necessário, sinalizar ausência.
- A hierarquia de conteúdo prevalece sobre decoração e referências visuais.
- Este documento é o padrão geral de **todas as artes do Mansões Crosstraining**, tanto individuais quanto semanais e HTML.

## Atualização do proprietário — TV como visualizador de artes
A orientação mais recente substitui a regra anterior de textos exclusivamente em HTML para as telas de treino: usar imagens horizontais completas, incluindo títulos, exercícios e números, como pôsteres. O HTML exibe a imagem inteira sem cortes e oferece navegação direta por setas e botões. Conferir cada texto da arte contra os dados JSON antes de publicar. Manter fallback HTML para treinos ainda sem arte.
