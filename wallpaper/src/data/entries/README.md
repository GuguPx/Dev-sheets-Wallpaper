# Comandos avulsos (contribuições)

Cada arquivo aqui é **um comando** que é somado a uma sheet existente:

```
entries/<id-da-tecnologia>/<id-do-comando>.json
```

Ex.: `entries/git/git-listar-worktrees.json` entra na aba **git**. Como cada contribuição é
um arquivo novo, PRs de pessoas diferentes nunca conflitam.

**Jeito mais fácil:** use o [editor web](https://gugupx.github.io/Dev-sheets-Wallpaper/editor/)
(sem git) ou `npm run new:cmd` (assistente no terminal). Os dois geram este arquivo pronto.

Formato (o mesmo de um item de `entries` em `technologies/<tech>.json`):

```json
{
  "id": "git-listar-worktrees",
  "title": "Listar worktrees",
  "command": "git worktree list",
  "description": "Mostra todas as árvores de trabalho ligadas ao repositório.",
  "category": "Status",
  "tags": ["worktree"],
  "difficulty": "intermediario",
  "platforms": ["all"],
  "risk": "seguro",
  "examples": [
    { "level": "basico", "code": "git worktree list", "explanation": "Lista as worktrees." }
  ],
  "arguments": [{ "flag": "--porcelain", "description": "Saída estável para scripts." }],
  "warnings": [],
  "relatedCommands": ["git worktree add"],
  "documentationUrl": "https://git-scm.com/docs/git-worktree"
}
```

Regras (checadas por `npm run validate:content` e pelo CI):

- O nome do arquivo é o `id` do comando (kebab-case, único na tecnologia).
- A pasta é o `id` de uma tecnologia que existe em `technologies/`.
- `category` pode ser nova: ela é acrescentada ao fim das categorias da sheet.
- Texto em pt-BR (fonte). Traduções ficam em `data/i18n/<idioma>/<tech>.json`, pelo mesmo `id`.
