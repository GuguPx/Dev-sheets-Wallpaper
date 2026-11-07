# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/).

## [Não lançado]

### Adicionado — contribuições fáceis

- **Editor web de sheets** (`docs/editor/`, publicado via GitHub Pages): formulário em PT/EN
  que lê as tecnologias atuais do GitHub, sugere id e risco, valida e abre o arquivo pronto
  no GitHub — que faz o fork e o Pull Request sozinho. Sem git, sem JSON.
- **Assistente no terminal**: `npm run new` / `new:cmd` / `new:sheet`.
- **Um comando por arquivo**: `wallpaper/src/data/entries/<tech>/<id>.json` é somado à sheet
  (`data/merge.ts`), com categoria nova automática. Contribuições não conflitam entre si.
- Comando interno **`:contribute`** (10 idiomas) com os links do editor e do repositório.
- `npm run editor` abre o editor localmente.

### Corrigido

- Links dos templates de issue apontavam para um repositório antigo.

### Adicionado — idiomas e apoio

- **10 idiomas** na interface e no conteúdo: pt-BR, en, es, fr, de, it, ru, zh-CN, ja, ko.
  Todos os 224 comandos (títulos, descrições, exemplos, opções, avisos e categorias) foram
  traduzidos; o que faltar cai no pt-BR campo a campo.
- **Seletor de idioma no Wallpaper Engine** (propriedade *Idioma*, padrão **Automático** —
  segue o sistema, fallback inglês) e rótulos do painel de propriedades traduzidos via
  `general.localization` do `project.json` (`npm run i18n:we`).
- Comando interno **`:lang <código>`** para trocar o idioma ao vivo (`:lang auto` volta ao
  automático).
- Comando interno **`:support`** (aliases `donate`, `coffee`, `apoiar`…): mensagem do autor
  traduzida e links de apoio que copiam ao clicar. Links configurados em
  `wallpaper/src/config/support.ts`; seção "Apoie o projeto" no README.
- Busca **Unicode**: tokens com cirílico, CJK e hangul agora funcionam.
- `npm run validate:i18n` (também no CI) e `npm run i18n:extract` para tradutores.

### Alterado

- O idioma padrão passou de `pt-BR` para **`auto`**. Quem já tinha configurado mantém a
  escolha salva.
- Linhas em branco nos overlays (`about`, `support`) agora aparecem como espaço entre
  parágrafos.

### Corrigido

- **Fonte monoespaçada não era aplicada em lugar nenhum** (o wallpaper inteiro renderizava
  em Times New Roman). `:root` declarava `--font-user: ;` — *vazia porém definida* — e
  `var(--font-user, ui-monospace, …)` só cai no fallback quando a variável **não existe**.
  Resultado: `font-family` ficava vazio, a declaração era descartada e valia o serif padrão
  do navegador, desalinhando todas as tabelas, molduras e colunas ASCII. A declaração foi
  removida do `:root` (a `SettingsStore` já a define inline quando o usuário escolhe fonte).

- **Conteúdo atrás da barra de tarefas:** o `.term` agora reserva uma margem inferior
  (`--safe-bottom`, padrão 48px) para a linha de comando/statusline e os cards não ficarem
  escondidos. Ajustável em **Settings → "Margem da barra de tarefas (px)"** (propriedade WE
  `safeBottom`, 0–120).
- **Scroll da roda do mouse** no Wallpaper Engine (CEF): um handler global de `wheel`
  agora rola manualmente o contêiner sob o cursor (painéis/overlays), pois o CEF nem sempre
  rola contêineres com overflow aninhado. Sem scroll duplo no navegador comum.

### Adicionado (metadados WE)

- `project.json`: opções de tema **VS Code** e **Caderno** e os sliders **safeBottom**,
  **safeLeft** e **safeRight**.

### Adicionado

- **Aba `▮ tty` (tela de descanso)**: esconde os cheat sheets atrás de uma sessão de
  terminal **fictícia** em loop (digitação caractere a caractere, cursor piscando entre
  comandos). São 8 cenas — `uptime`/`free`, `docker compose ps` + `stats`, `tail -f`,
  `git status`/`log --graph`, build + testes, `df`/`ss`, `kubectl`, `ps aux`/`systemctl` —
  em ordem **sorteada a cada volta**, sem limpar entre elas: a tela enche e rola como um
  terminal real (teto de 120 linhas por coluna). Em telas largas divide-se em até **3
  colunas** independentes — cada uma com roteiro, cursor e rolagem próprios, com início
  escalonado para não digitarem em uníssono. O número de colunas vem da largura da linha
  mais larga medida em `ch` na fonte atual, então acompanha `fontScale`/`uiScale` e a
  resolução sem quebrar as tabelas. Fica ao lado de `★ rec` e responde à tecla `0`.
  Respeita `reducedMotion` (quadro estático) e congela com a janela oculta; o painel de
  comandos nem é re-renderizado enquanto ela está ativa.

- **Tela de descanso automática por inatividade** (`IdleTimer`): após N minutos sem
  mouse/teclado o devsheet entra sozinho na aba `tty`, e qualquer interação acorda
  restaurando a aba/categoria/seleção que estava aberta. Configurável em **Settings →
  "Tela de descanso após"** (propriedade WE `idleTimeout`, 0–60 min, padrão 5; `0`
  desliga). Distingue automático de manual (`idleAuto`): a aba `tty` escolhida no clique
  não sai com o mouse. Fecha busca/manual/ajuda ao dormir — senão o overlay ficaria por
  cima expondo o que a tela deveria esconder — mas **não** interrompe quem está com nota
  ou linha de comando aberta (rascunho não salvo).

- **Margens laterais de segurança** (`--safe-left` / `--safe-right`, padrão 160px à
  esquerda e 0 à direita) para o terminal não cobrir os **ícones da área de trabalho**.
  Ajustáveis em **Settings → "Margem esquerda/direita — ícones da área de trabalho (px)"**
  (propriedades WE `safeLeft`/`safeRight`, 0–600) ou ao vivo pelo comando
  `:margin <lado> <px>` — que também ajusta a base (`:margin bottom 48`).
- **`wallpaper/preview.jpg`** (thumbnail do Wallpaper Engine) — capturado do próprio
  wallpaper na visão "Recomendados"; o `copy-to-wallpaper` agora o inclui no pacote.

### Alterado

- **Usuário padrão do prompt**: `victor` → `augusto` (default, exemplos e `project.json`).
  Quem tinha `victor` salvo — o default antigo — herda o novo; nomes personalizados ficam.

- **Visão inicial "Recomendados / mais usados"**: ao abrir, o devsheet mostra os comandos
  **essenciais** (dificuldade `basico`) de todas as tecnologias, agrupados **por
  tecnologia** (um card por tech). Uma aba `★ rec` (ativa por padrão) alterna essa visão;
  escolher uma tecnologia (aba ou clique no card) abre a visão **por tecnologia** (cards por
  categoria). Navegação por teclado (`j/k`) e cópia funcionam nas duas.
- **Menu lateral removido**: sem o rail de categorias; o painel de comandos ocupa a largura
  toda. Drill-in numa categoria é feito pelo cabeçalho do card; voltar à visão geral é
  clicar de novo na aba da tecnologia (ou na aba `rec`).
- **Visão geral em grade "bento"**: na categoria "todos", o painel de comandos agora
  mostra **um card (quadrado) por categoria** — cada um com seus comandos realçados, tag de
  risco e descrição — numa grade responsiva, inspirado em cheat sheets modernos. Clicar no
  cabeçalho de um card entra na categoria (lista densa para leitura). Seleção e navegação
  por teclado (`j/k`) continuam valendo na grade.
- **Menu lateral de categorias** agora é moderno e discreto: fica recolhido num **rail
  estreito** (~2.6em) mostrando só um chevron e a categoria ativa na vertical, e **expande
  como overlay** ao passar o mouse ou receber foco de teclado (`h`), sem empurrar o layout
  — o painel de comandos ocupa toda a largura quando recolhido. Recolhe ao sair
  (`:hover`/`:focus-within`/`.is-open`).

### Adicionado

- **Tema `caderno`** (claro, estilo cheat sheet de caderno): fundo creme, tinta escura,
  acento laranja e código numa **paleta de sintaxe clara** (roxo/teal/âmbar/verde), com
  linhas pautadas discretas, cantos suaves e sombra de página. Único tema light — força
  `color-scheme: light` e desliga o CRT. Total agora **8 temas**.
- **Tema `vscode`** (VS Code Dark+): fundo `#1e1e1e`, azul de status `#3794ff` e o realce
  de sintaxe base (que já é Dark+), fazendo o wallpaper parecer o próprio editor. Total
  agora **7 temas**; entra no ciclo da tecla `t` e no comando `:theme vscode`.
- **Ícones de tecnologia coloridos**: cada aba usa a cor de marca da tecnologia
  (git vermelho, docker azul, linux amarelo…), suave quando inativa e plena na ativa; o
  ícone do cabeçalho do painel de comandos também segue a marca.
- **Glifos de ícone** mais reconhecíveis (linux/tux, nginx, redis) e cobertura para as
  tecnologias do roadmap (node, typescript, javascript, react, next, python, go, etc.).

### Corrigido

- `h()` (core/dom) agora aplica **CSS custom properties** (`--tab-accent`) via
  `setProperty`; antes `Object.assign(el.style, …)` as ignorava, então as cores de marca
  das tecnologias nunca apareciam nas abas.

## [1.0.0] — 2026-07-19

### Adicionado

- **Shell de terminal** estilo Tmux: barra de tecnologias (abas), painel de categorias,
  painel de comandos, painel de detalhes opcional, linha de comando e statusline (Neovim).
- **Modos** estilo Vim: `NORMAL`, `SEARCH`, `COMMAND`, `MANUAL`, `NOTES`, `HELP`, cada um
  com atalhos e statusline próprios.
- **Navegação completa por teclado** (`j/k`, `gg`, `G`, `h/l`, `1..9`, `Ctrl+Tab`) e
  **operação por mouse** como alternativa (relevante no Wallpaper Engine).
- **Busca estilo FZF** (`/` ou `Ctrl+K`): offline, sem acento, case-insensitive, por
  comando/tecnologia/descrição/categoria/tags, com destaque de correspondências.
- **Detalhes estilo man page** (`Enter`) com rolagem tipo `less`.
- **Parser de comandos interno** com whitelist e aliases (sem `eval`, sem shell).
- **Favoritos** (localStorage), **histórico/atividade** (localStorage) e **notas**
  (IndexedDB), todos locais — nada é transmitido.
- **Cópia segura**: `y` copia; comandos destrutivos exigem **dupla confirmação** e ainda
  assim apenas copiam texto.
- **Classificação de risco** `[safe] / [warning] / [danger]` com heurística de segurança
  (mesmo conteúdo mal marcado dispara o aviso).
- **6 temas** (graphite, ice, mint, amber, violet, classic-green) e **efeitos CRT**
  configuráveis (scanlines, flicker, glow, ruído, vinheta, aberração, curvatura) com nível
  `off/low/balanced/high`.
- **Sequência de boot** curta e desligável.
- **Integração Wallpaper Engine** via `window.wallpaperPropertyListener` com ~30
  propriedades (tema, fonte, escala, painéis, CRT, relógio, densidade, FPS, etc.).
- **Conteúdo**: 10 tecnologias / 224 comandos — git, docker, docker-compose, linux, bash,
  ssh, nginx, pm2, postgresql, redis — validados por Zod.
- **Testes** (Vitest): parser, teclado, busca, storage, schemas, modos.
- **Scripts**: `validate-content`, `generate-search-index`, `copy-to-wallpaper`, `build.ps1`.

### Notas

- Base de conteúdo pensada para crescer em lotes (ver `CONTENT_GUIDE.md`) rumo às demais
  tecnologias da especificação (Node.js, TypeScript, React, GitHub Actions, SQL, etc.).
