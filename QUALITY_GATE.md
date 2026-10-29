# Cross Mansões TV — Regra Permanente de Qualidade

A partir desta versão, toda alteração no sistema deve obedecer ao seguinte gate de qualidade:

1. **Nenhuma alteração é considerada pronta apenas por código escrito.**
2. Toda mudança deve passar por:
   - testes unitários;
   - testes funcionais de navegação;
   - verificação de clique real no calendário;
   - verificação de navegação por teclado / controle remoto;
   - verificação de ausência de erros JavaScript;
   - verificação de que o conteúdo principal cabe na tela, sem overflow vertical ou horizontal;
   - validação visual em pelo menos 1920x1080 e 1366x768.
3. Se qualquer teste falhar, a alteração não deve ser publicada.
4. Se o problema for detectado, a correção deve acontecer **antes de considerar a entrega concluída**.
5. Mudanças de layout devem priorizar:
   - leitura à distância;
   - uso máximo da área útil da TV;
   - clareza de Aquecimento, Skill, WOD e Adaptações;
   - navegação simples por controle remoto.

## Critério de aceite mínimo

Uma versão só pode ser declarada estável quando:
- o dia com treino abre ao clique;
- as modalidades aparecem corretamente;
- o treino é carregado sem erro;
- os botões funcionam;
- os slides cabem na tela;
- os testes automatizados passam.
