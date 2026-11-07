# Guia de conteúdo

Cada tecnologia é **um arquivo JSON** em `wallpaper/src/data/technologies/`. O Vite os
descobre automaticamente (`import.meta.glob`), então **basta criar o arquivo** — nenhum
código muda. Tudo é validado por Zod; conteúdo inválido não entra em silêncio.

## Passo a passo

> **Atalho:** o [editor web](https://gugupx.github.io/Dev-sheets-Wallpaper/editor/) e o assistente `npm run new` geram os arquivos abaixo
> prontos e validados. Este guia é para quem quer entender ou editar à mão.

**Comando novo numa sheet que já existe** — crie um arquivo por comando:

1. `wallpaper/src/data/entries/<tech>/<id>.json` — `<tech>` é o id da sheet (`git`,
   `docker`…) e o nome do arquivo é o `id` do comando.
2. O conteúdo é **um objeto de comando** (os mesmos campos de um item de `entries`, abaixo).
   Categoria nova é aceita e vai para o fim da lista da sheet.

**Tecnologia nova (sheet):**

1. Crie `wallpaper/src/data/technologies/<id>.json` (id em kebab-case: `github-actions`)
   com pelo menos um comando em `entries`.
2. Os próximos comandos podem ir em `entries/<id>/` (acima).

Depois, nos dois casos: `npm run validate:content` (corrija o que for apontado) e
`npm run dev` — o comando/aba aparece.

## Formato

```jsonc
{
  "id": "redis",                       // kebab-case, único
  "name": "Redis",                     // nome exibido
  "shortName": "Redis",                // curto (cabeçalhos)
  "prompt": "redis",                   // aparece no prompt e na aba (opcional; default = id)
  "icon": "redis",                     // chave textual do ícone
  "color": "#FF4438",                  // hex #rgb ou #rrggbb (cor de acento da aba)
  "description": "Banco chave-valor…", // 1 linha
  "documentationUrl": "https://redis.io/docs/latest/commands/",
  "version": "7.x",
  "lastReviewedAt": "2026-07-18",      // YYYY-MM-DD
  "categories": ["strings", "keys"],   // ids ASCII (evite acentos — ver nota)
  "entries": [
    {
      "id": "set",                     // kebab-case, único na tecnologia
      "title": "Definir valor",
      "command": "SET chave valor",
      "description": "Grava uma string em uma chave.",  // >= 10 caracteres
      "category": "strings",           // DEVE existir em "categories"
      "tags": ["set", "string"],
      "difficulty": "basico",          // basico | intermediario | avancado
      "platforms": ["linux", "macos"], // linux | macos | windows | all (>= 1)
      "risk": "seguro",                // seguro | atencao | perigoso
      "examples": [
        { "level": "basico", "code": "SET k v EX 60", "explanation": "Com TTL.", "expected": "" }
      ],
      "arguments": [
        { "flag": "EX", "description": "Expiração em segundos.", "optional": true }
      ],
      "warnings": ["Sobrescreve o valor existente."],
      "relatedCommands": ["get", "del"] // ids de entradas (mesma tech) ou "tech:id"
    }
  ]
}
```

Campos com default: `tags`, `examples`, `arguments`, `warnings`, `relatedCommands` (`[]`);
`prompt` (deriva do `id`); `documentationUrl`/`expected`/`optional` são opcionais.

## Enums (português, internos)

- **risk**: `seguro` → `[safe]`, `atencao` → `[warning]`, `perigoso` → `[danger]`.
- **difficulty** / **examples[].level**: `basico`, `intermediario`, `avancado`.
- **platforms**: `linux`, `macos`, `windows`, `all`.

O nível de risco final é o **maior** entre o declarado e o detectado por heurística
(`utils/risk.ts`) — marque corretamente, mas comandos perigosos são pegos mesmo se esquecer.

## Boas práticas

- **Não invente comandos** — use a documentação oficial (link em `documentationUrl`).
- Marque como `perigoso` tudo que apaga/sobrescreve sem retorno (`rm -rf`, `DROP DATABASE`,
  `FLUSHALL`, `docker system prune -a`, `down -v`, `pm2 delete all`).
- **Categorias com ids ASCII** (`configuracao`, não `configuração`): o rótulo é derivado
  por Title Case; ids sem acento evitam capitalização estranha.
- Descrições curtas e diretas (mín. 10 caracteres). Detalhes vão em `examples`/`arguments`.
- `relatedCommands` melhora a seção "SEE ALSO" do manual.

## Metas de cobertura

A fatia atual (git, docker, docker-compose, linux, bash, ssh, nginx, pm2, postgresql,
redis) é a base. Próximos lotes sugeridos pela especificação: SQL, Node.js, TypeScript,
JavaScript, React, GitHub Actions, systemd, cron, MongoDB, Prisma, etc. Adicione um JSON
por vez e rode `npm run validate:content`.

## Traduções

O JSON de cada tecnologia é escrito em **pt-BR** e é a fonte. Cada idioma tem um *overlay*
com **só os textos** em `wallpaper/src/data/i18n/<código>/<tech>.json`:

```json
{
  "description": "…",
  "categories": { "Inicialização": "Initialization" },
  "entries": {
    "git-init": {
      "title": "Initialize repository",
      "description": "…",
      "examples": ["explanation do 1º exemplo", "…"],
      "arguments": ["description do 1º argumento", "…"],
      "warnings": []
    }
  }
}
```

Regras:

- **Nunca** traduza chaves: ids de entrada e as chaves de `categories` ficam como no fonte.
- `examples`, `arguments` e `warnings` têm o **mesmo tamanho e ordem** do fonte.
- Não traduza comandos, flags, código, caminhos ou nomes de produto.
- Campo ausente ou `""` usa o texto pt-BR — dá para traduzir aos poucos.

Fluxo:

1. `npm run i18n:extract -- ./tmp-i18n` gera os modelos (texto pt-BR) de todas as tecnologias.
2. Traduza os valores e salve em `wallpaper/src/data/i18n/<código>/`.
3. `npm run validate:i18n` (ou `npx tsx scripts/i18n-content.ts check <código>`) valida a
   estrutura e mostra a cobertura.

Ao **adicionar ou alterar um comando** no pt-BR, rode `npm run validate:i18n`: ids removidos
ou arrays com tamanho diferente viram erro; textos novos sem tradução aparecem como cobertura
abaixo de 100% (e caem no pt-BR até alguém traduzir).

**Novo idioma:** registre-o em `wallpaper/src/i18n/languages.ts` (com o código de locale do
Wallpaper Engine), crie `wallpaper/src/i18n/locales/<código>.ts` copiando `en.ts`, adicione a
coluna em `scripts/we-localization.mjs` e rode `npm run i18n:we`.
