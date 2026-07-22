# devsheet

Um **terminal de consulta de cheat sheets** de desenvolvimento e DevOps, feito como
**Web Wallpaper** para o [Wallpaper Engine](https://www.wallpaperengine.io/). Não parece
um site nem um dashboard: parece um terminal real — abas estilo **Tmux**, statusline
estilo **Neovim**, busca estilo **FZF** e detalhes estilo **man page**.

> Ferramenta **somente de consulta**. O terminal **não executa nenhum comando do sistema** —
> apenas navega, exibe e copia texto (ver [Segurança](#segurança)).

```
┌─ devsheet ─────────────────────────────────────────────────────────────────┐
│ [1:git*] [2:docker] [3:compose] [4:linux] [5:bash] [6:ssh] [7:nginx]  …    │
├──────────────────────────────┬──────────────────────────────────────────────┤
│ CATEGORIES        git         │ GIT · repository                    03/36    │
│ > repository                  │  01  git status                      [safe]  │
│   staging                     │      Exibe o estado atual do repositório.    │
│   commit                      │ !08  git reset --hard <commit>    [danger]   │
├──────────────────────────────┴──────────────────────────────────────────────┤
│ augusto@devsheet:git$ open docker_                                           │
├──────────────────────────────────────────────────────────────────────────────┤
│ NORMAL │ git │ repository │ 03/36 │ UTF-8 │ PT-BR │ / search │ ? help │ 18:42 │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Prévia

![Visão geral do devsheet rodando como papel de parede](docs/screenshots/overview.png)

<table>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/git-categorias.png" alt="Aba git com os comandos agrupados por categoria" /><br />
      <sub><b>Por categoria</b> — cada tecnologia abre em abas estilo Tmux.</sub>
    </td>
    <td width="50%">
      <img src="docs/screenshots/manual.png" alt="Detalhe de um comando no formato man page" /><br />
      <sub><b>Manual</b> — <code>Enter</code> abre o comando no formato <i>man page</i>.</sub>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/tty-descanso.png" alt="Aba tty com terminal fictício em loop" /><br />
      <sub><b>Aba <code>tty</code></b> — terminal fictício em loop / tela de descanso.</sub>
    </td>
    <td width="50%">
      <img src="docs/screenshots/boot.png" alt="Sequência de boot do devsheet" /><br />
      <sub><b>Boot</b> — sequência de inicialização estilo terminal.</sub>
    </td>
  </tr>
</table>

## Requisitos

- Node.js **18+**
- Wallpaper Engine (para usar como papel de parede) — opcional; roda em qualquer navegador.

## Começando

```bash
npm install        # instala dependências (uma vez)
npm run dev        # abre o dev server (http://localhost:5173)
```

Abra a URL no navegador. Tudo funciona **offline**, sem back-end.

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Dev server (Vite) com HMR. |
| `npm run build` | Typecheck + build **single-file** em `dist/index.html`. |
| `npm run build:wallpaper` | Build + monta o pacote do Wallpaper Engine em `dist/`. |
| `npm test` | Testes (Vitest). |
| `npm run typecheck` | Checagem de tipos (sem emitir). |
| `npm run validate:content` | Valida todos os JSONs de conteúdo com Zod. |
| `npm run gen:index` | Gera `search-index.json` (artefato de inspeção; o bundle não usa). |
| `npm run lint` / `npm run format` | ESLint / Prettier. |

O CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) roda formatação, lint, tipos,
validação de conteúdo, testes e build a cada push e pull request.

Também há um script único: `pwsh scripts/build.ps1` (valida, testa, builda e empacota).

## Importar no Wallpaper Engine

1. `npm run build:wallpaper` — gera `dist/` com `index.html` (app autocontido) + `project.json`.
2. (Opcional) coloque uma imagem `wallpaper/preview.jpg` antes do build para virar o thumbnail.
3. Copie o **conteúdo de `dist/`** para uma pasta em
   `Steam/steamapps/common/wallpaper_engine/projects/myprojects/devsheet/`
   **ou** no Wallpaper Engine use *Create Wallpaper → Files* e aponte para `dist/index.html`.
4. O projeto aparece na sua biblioteca. As propriedades (tema, CRT, painéis, etc.) ficam
   em *Customize* — ver [seção 26](#propriedades-do-wallpaper-engine).

O build é um **único HTML** com JS, CSS e dados embutidos: nada é baixado em runtime.

## Uso

- **Teclado** (completo): navegue com `j/k`, troque de tecnologia com `1..9`, busque com `/`,
  abra o manual com `Enter`, copie com `y`, favorite com `f`. Veja [KEYBINDINGS.md](KEYBINDINGS.md).
- **Mouse** (fallback): tudo é clicável — abas, categorias, comandos e os botões
  `man`/`copy`/`fav` de cada linha. Importante no Wallpaper Engine (ver abaixo).
- **Linha de comando interna** (`:`): `open docker`, `search rebase`, `theme ice`,
  `favorites`, `history`, `about`… (whitelist; nunca toca no sistema).

### Aba `tty` — esconder os sheets

A aba **`▮ tty`** (tecla `0`, ao lado de `★ rec`) troca os cheat sheets por uma sessão de
terminal fictícia rodando em loop — útil para compartilhar a tela sem expor o conteúdo, ou
só como tela de descanso. São 8 cenas (`docker compose ps`, `tail -f`, `kubectl`, build,
disco/rede, processos…) em ordem sorteada a cada volta, e a tela vai enchendo e rolando em
vez de limpar entre elas. Em monitores largos ela se divide em até **3 colunas
independentes**, cada uma com sua própria sessão, para ocupar a tela toda. A saída é
inventada: nada ali lê a máquina nem executa comandos.

Ela também **abre sozinha após alguns minutos sem interação** (padrão 5 min; ajuste em
Settings → *Tela de descanso após*, ou `0` para desligar). Nesse caso qualquer movimento de
mouse ou tecla acorda e devolve exatamente a aba/categoria que estava aberta. Já quando
você escolhe a aba `tty` na mão, ela fica até você clicar em outra — mexer o mouse não tira.
A statusline diz qual dos dois casos está valendo.

Com **movimento reduzido** ligado, ela vira um quadro estático; com a janela oculta, o loop
congela como o resto da app.

### Espaço para os ícones da área de trabalho

O terminal reserva margens de segurança para não cobrir os ícones do desktop nem a barra
de tarefas: **esquerda** (padrão 160px), **direita** (0) e **base** (48px). Ajuste em
**Settings** do Wallpaper Engine (`safeLeft`, `safeRight`, `safeBottom`, 0–600px) ou, no
preview/navegador, ao vivo com `:margin left 240`, `:margin right 0`, `:margin bottom 48`
(`:margin 240` sozinho vale para a esquerda).

### ⚠️ Teclado no Wallpaper Engine

Papéis de parede web no Wallpaper Engine recebem entrada de teclado de forma **limitada e
inconsistente** (o foco costuma ficar no desktop). Por isso a interface é **100% operável
pelo mouse** como alternativa. No navegador/preview o teclado funciona plenamente.

## Temas e CRT

8 temas: **graphite, ice, mint, amber, violet, vscode, caderno, classic-green**
(alterne com `t` ou `:theme <nome>`). O tema **vscode** (VS Code Dark+) combina com o
realce de sintaxe, deixando o wallpaper com cara de editor; o **caderno** é o único claro
(fundo de papel creme, código colorido em paleta clara, linhas pautadas) — inspirado em
cheat sheets de caderno. Efeitos CRT opcionais (scanlines, flicker, glow,
ruído, vinheta, aberração cromática, curvatura) com nível `off/low/balanced/high` — sutis
por padrão e desligáveis.

## Conteúdo

Atualmente **10 tecnologias / 224 comandos**: git, docker, docker-compose, linux, bash,
ssh, nginx, pm2, postgresql, redis. Cada tecnologia é um JSON em
`wallpaper/src/data/technologies/`, validado por Zod. Para adicionar/expandir, veja
[CONTENT_GUIDE.md](CONTENT_GUIDE.md). Comandos são baseados na documentação oficial.

## Estrutura

Veja [ARCHITECTURE.md](ARCHITECTURE.md) para detalhes. Resumo:

```
devsheet-wallpaper/
├── wallpaper/            # o app (Vite root)
│   ├── index.html · project.json · vite.config.ts · tsconfig.json
│   └── src/
│       ├── terminal/     # shell, modos, teclado, parser, boot
│       ├── panes/        # abas, categorias, comandos, manual, busca, ajuda, statusline…
│       ├── services/     # conteúdo, busca, storage, clipboard, wallpaper engine
│       ├── stores/       # settings, app, favorites, history, notes
│       ├── schemas/ · types/ · utils/ · data/technologies/ · styles/
├── scripts/             # validate-content, generate-search-index, build.ps1, copy-to-wallpaper
├── tests/               # parser, keyboard, search, storage, schemas, modes
└── README · ARCHITECTURE · CONTENT_GUIDE · KEYBINDINGS · CHANGELOG
```

> **Nota de estrutura:** por decisão de DX, há **um único `package.json`/`node_modules`**
> na raiz (o `wallpaper/package.json` é apenas um marcador). Um segundo tree de
> dependências seria redundante para um wallpaper.

## Contribuindo

Contribuições são bem-vindas — sobretudo **conteúdo** (novos comandos ou correções). Veja o
**[guia de contribuição](CONTRIBUTING.md)** para preparar o ambiente e o fluxo de PR, o
**[guia de conteúdo](CONTENT_GUIDE.md)** para o formato dos JSONs, e o
**[código de conduta](CODE_OF_CONDUCT.md)**. Use as [issues](../../issues/new/choose) para
relatar bugs, sugerir ideias ou propor conteúdo.

## Segurança

O terminal é **apenas visual**. Ele **não** implementa: execução de comandos, shell,
PowerShell, acesso a arquivos, processos, rede, credenciais ou tokens. A linha de comando
aceita **somente** uma whitelist interna (`src/terminal/CommandParser.ts`), sem `eval`.
A cópia de comandos destrutivos exige **dupla confirmação** e ainda assim apenas copia o
texto — nunca executa.

## Licença

MIT — ver [LICENSE](LICENSE).
