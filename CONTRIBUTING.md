# Contribuindo com o devsheet

Obrigado pelo interesse! Este é um **wallpaper web** de cheat sheets para o
[Wallpaper Engine](https://www.wallpaperengine.io/). A forma mais comum de contribuir é
**adicionar ou corrigir conteúdo** (comandos), mas correções de código e ideias também são
bem-vindas.

Antes de um trabalho grande, **abra uma issue** para alinharmos — evita esforço em algo que
talvez não entre.

## Sumário rápido

| Quero… | Vá para |
| --- | --- |
| Adicionar/corrigir comandos de uma tecnologia | [Contribuir com conteúdo](#contribuir-com-conteúdo) |
| Corrigir um bug ou mexer no código | [Contribuir com código](#contribuir-com-código) |
| Sugerir uma ideia | Abra uma [issue de feature](../../issues/new/choose) |
| Relatar um problema | Abra uma [issue de bug](../../issues/new/choose) |

## Preparando o ambiente

Requisitos: **Node.js 18+** e npm.

```bash
git clone https://github.com/<seu-usuario>/devsheet-wallpaper.git
cd devsheet-wallpaper
npm ci          # instala as dependências (use "npm install" se não houver lockfile no seu fork)
npm run dev     # sobe o Vite com HMR; abra o endereço que ele imprime
```

A aplicação roda **igual no navegador e no Wallpaper Engine** — para desenvolver, o
navegador basta. Você não precisa do Wallpaper Engine instalado para contribuir.

## Contribuir com conteúdo

Cada tecnologia é **um arquivo JSON** em `wallpaper/src/data/technologies/`. O Vite
descobre os arquivos sozinho, então **basta criar/editar o JSON** — nenhum código muda.

1. Leia o **[Guia de conteúdo](CONTENT_GUIDE.md)** — ele tem o formato completo, os enums e
   as boas práticas.
2. Crie ou edite `wallpaper/src/data/technologies/<id>.json`.
3. Valide: `npm run validate:content` — corrija o que for apontado (tudo passa por Zod).
4. Confira no navegador: `npm run dev`.

Regras de ouro do conteúdo:

- **Não invente comandos.** Baseie-se na documentação oficial e coloque o link em
  `documentationUrl`.
- **Marque o risco corretamente.** Tudo que apaga/sobrescreve sem volta é `perigoso`
  (`rm -rf`, `DROP DATABASE`, `FLUSHALL`, `down -v`…).
- **Atenção ao idioma:** os enums internos (`risco`, `dificuldade`) são em português de
  propósito — não os traduza. Detalhes no guia.

## Contribuir com código

Arquitetura em [ARCHITECTURE.md](ARCHITECTURE.md); atalhos em [KEYBINDINGS.md](KEYBINDINGS.md).

Antes de abrir o PR, rode a mesma bateria que o CI roda — se tudo passar aqui, passa lá:

```bash
npm run format          # Prettier (formata)
npm run lint            # ESLint
npm run typecheck       # TypeScript (sem emitir)
npm run validate:content
npm test                # Vitest
npm run build           # build single-file de sanidade
```

Diretrizes:

- **Sem novas dependências de runtime** sem discussão — o projeto é TypeScript puro, sem
  framework, e o bundle é um **HTML único**. Manter isso é um objetivo, não um acidente.
- **Escreva teste** para lógica pura nova (parser, teclado, busca, schemas seguem esse
  padrão em `tests/`).
- **Nada de executar comandos do sistema.** O terminal só consulta, exibe e copia texto —
  é uma promessa de segurança do projeto. Veja a seção de segurança no README.
- Combine o estilo do arquivo em que você mexe (o Prettier cuida da formatação).

## Commits e Pull Requests

- Trabalhe num **branch** a partir do `main` (`feat/nome-curto`, `fix/nome-curto`,
  `content/nova-tech`).
- Mensagens no estilo **Conventional Commits**: `feat:`, `fix:`, `docs:`, `content:`,
  `chore:`, `refactor:`, `test:`.
- Abra o PR contra o `main`, preencha o template e **descreva o que muda e por quê**.
- Um PR por assunto. PRs menores são revisados mais rápido.

O CI precisa ficar verde para o merge. Não é preciso rodar `npm run build:wallpaper` num PR —
isso é passo de publicação, feito pelo mantenedor.

## Dúvidas

Abra uma issue com o que você quer fazer. Respostas podem levar alguns dias — é um projeto
mantido em tempo livre.
