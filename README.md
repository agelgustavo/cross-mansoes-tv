# Cross Mansões TV

Aplicação estática para o navegador de televisão TCL do Mansões Crosstraining.

- Calendário com modalidades por dia (vermelho = CrossFit; azul = Hybrid Run)
- Slides de aquecimento, skill, WOD e adaptações
- Navegação via controle remoto: setas, Enter e Voltar
- Relógio em horário de Brasília
- Dados separados em `data/index.json` e `data/AAAA-MM-DD.json`
- Atualização de conteúdo sem trocar a URL principal

## Desenvolvimento e validação

```bash
npm install
npm test
npx playwright install chromium
npm run test:e2e
```

GitHub Actions executa testes antes de publicar no GitHub Pages. O Service Worker antigo fica desativado em v2, para evitar servir código antigo no navegador da TV.

Site: https://agelgustavo.github.io/cross-mansoes-tv/
