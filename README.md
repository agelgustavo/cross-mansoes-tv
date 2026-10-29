# Cross Mansões TV

Aplicação web para exibir os treinos do Cross Mansões em TVs, com calendário, modo CrossFit/Hybrid Run, slides de aquecimento, skill, WOD e adaptações e navegação por controle remoto.

## Publicação

O workflow `.github/workflows/pages.yml` publica automaticamente a branch `main` no GitHub Pages.

**URL:** https://agelgustavo.github.io/cross-mansoes-tv/

No GitHub, configure **Settings → Pages → Build and deployment → Source = GitHub Actions**. Em **Actions**, confira o workflow **Deploy GitHub Pages**.

## Conteúdo

- `data/index.json`: índice de dias com treino;
- `data/AAAA-MM-DD.json`: conteúdo estruturado por modalidade;
- `index.html`: aplicação da TV;
- `sw.js`: cache para funcionamento offline após o primeiro carregamento.

A aplicação começa com o calendário vazio. Treinos serão publicados posteriormente.
