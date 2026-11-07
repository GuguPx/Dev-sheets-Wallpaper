# Atalhos e comandos internos

A interface é operável 100% pelo teclado. Tudo também é clicável pelo mouse (importante no
Wallpaper Engine, que limita o teclado).

## Modos (estilo Vim)

| Modo | Entra com | Sai com |
| --- | --- | --- |
| **NORMAL** | `Esc` (de qualquer modo) | — |
| **SEARCH** | `/` ou `Ctrl+K` | `Esc` / `Enter` |
| **COMMAND** | `:` | `Esc` / `Enter` |
| **MANUAL** | `Enter` sobre um comando | `q` / `Esc` |
| **NOTES** | `n` | `Ctrl+Enter` (salva) / `Esc` |
| **HELP** | `?` | `q` / `Esc` / `?` |

A statusline inferior muda conforme o modo ativo.

## NORMAL — navegação

| Tecla | Ação |
| --- | --- |
| `j` / `↓` | Próximo item |
| `k` / `↑` | Item anterior |
| `h` / `←` | Foco no painel de categorias |
| `l` / `→` | Foco no painel de comandos |
| `g g` | Primeiro item |
| `G` | Último item |
| `Enter` | Abrir o manual do comando (ou entrar nos comandos, se o foco está nas categorias) |
| `Esc` | Voltar ao modo NORMAL |

## Tecnologias (abas)

| Tecla | Ação |
| --- | --- |
| `1` … `9` | Selecionar a tecnologia pela posição |
| `Alt+1` … `Alt+9` | Idem |
| `Ctrl+Tab` | Próxima tecnologia |
| `Ctrl+Shift+Tab` | Tecnologia anterior |
| `0` | Aba **tty** — tela de descanso que esconde os sheets |

## Ações

| Tecla | Ação |
| --- | --- |
| `y` | Copiar o comando (dupla confirmação se destrutivo) |
| `f` | Favoritar / desfavoritar |
| `n` | Adicionar/editar nota (IndexedDB) |
| `t` | Alternar tema |
| `/` | Busca (FZF) |
| `Ctrl+K` | Busca (command palette) — funciona de qualquer modo |
| `:` | Linha de comando interna |
| `?` | Ajuda |

## MANUAL (man page) — rolagem estilo `less`

| Tecla | Ação |
| --- | --- |
| `j` / `k` | Descer / subir |
| `PageDown` / `d` / `Space` | Próxima página |
| `PageUp` / `u` | Página anterior |
| `g g` / `G` | Início / fim |
| `y` `f` `n` | Copiar / favoritar / anotar o comando aberto |
| `q` / `Esc` | Fechar |

## SEARCH (FZF)

| Tecla | Ação |
| --- | --- |
| digitar | Filtra comandos (offline, ignora acento e maiúsculas) |
| `↑` / `↓` (ou `Ctrl+k` / `Ctrl+j`) | Selecionar resultado |
| `Enter` | Abrir o resultado |
| `Esc` | Fechar |

## Linha de comando interna (`:`)

Sem `eval`, sem shell — apenas a whitelist abaixo. Aceita aliases.

| Comando | Alias | Ação |
| --- | --- | --- |
| `help` | `?`, `h` | Abre a ajuda |
| `open <tech>` | `o` | Abre uma tecnologia (`open docker`) |
| `category <nome>` | `cat`, `c` | Filtra por categoria (`category branch`) |
| `search <termo>` | `s` | Abre a busca já preenchida (`search rebase`) |
| `favorites` | `fav`, `f` | Lista os favoritos |
| `history` | `recent`, `hist` | Lista o histórico local |
| `notes` | `note` | Lista as anotações |
| `theme <nome>` | `t` | Troca o tema (`theme ice`) |
| `font <px>` | — | Ajusta o tamanho da fonte (`font 18`) |
| `margin <lado> <px>` | `margem`, `m` | Margem de segurança 0–600px: `margin left 200`, `margin right 0`, `margin bottom 48`. Sem lado (`margin 160`) vale para a esquerda |
| `clear` | `cls` | Limpa a linha e volta ao início |
| `about` | — | Sobre o devsheet |
| `lang <código>` | `language`, `idioma`, `locale` | Troca o idioma: `lang en`, `lang ja`, `lang auto`. Sem argumento lista os códigos (`pt-BR en es fr de it ru zh-CN ja ko`) |
| `support` | `donate`, `coffee`, `sponsor`, `apoiar`, `apoio` | Mensagem do autor e links de apoio (clique copia o link) |
| `contribute` | `contrib`, `contribuir`, `add-sheet` | Como adicionar comandos/sheets: link do editor web e do repositório (clique copia) |
