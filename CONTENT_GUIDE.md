# Guia de conteúdo

Cada tecnologia é **um arquivo JSON** em `wallpaper/src/data/technologies/`. O Vite os
descobre automaticamente (`import.meta.glob`), então **basta criar o arquivo** — nenhum
código muda. Tudo é validado por Zod; conteúdo inválido não entra em silêncio.

## Passo a passo

1. Crie `wallpaper/src/data/technologies/<id>.json` (id em kebab-case: `github-actions`).
2. Preencha os campos abaixo.
3. Rode `npm run validate:content` — corrija o que for apontado.
4. `npm run dev` e a nova aba aparece.

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
