# Arquitetura

`devsheet` é uma SPA em **TypeScript puro** (sem framework), renderizada com um helper
`h()` (hyperscript) e um store reativo mínimo. O build gera um **único HTML** autocontido
para o Wallpaper Engine.

## Camadas

```
┌ Apresentação (TUI) ─────────────────────────────────────────────┐
│  terminal/TerminalShell   orquestra o layout e os overlays       │
│  terminal/ModeManager     transições NORMAL·SEARCH·COMMAND·…     │
│  terminal/KeyboardManager roteia teclas por modo (resolver puro) │
│  terminal/CommandParser   whitelist da linha de comando (puro)   │
│  terminal/BootSequence    animação de inicialização              │
│  terminal/actions         operações compartilhadas (copiar, fav) │
│  panes/*                  Tabs, Category, Command, Manual, Search,│
│                           Help, Notes, Details, StatusLine,      │
│                           CommandLine, Toast, Confirm, Info      │
└───────────────────────────────┬─────────────────────────────────┘
                                │ leem estado / emitem eventos
┌ Infraestrutura ───────────────┴─────────────────────────────────┐
│  stores/    Settings, App, Favorites, History, Notes            │
│  services/  Content, Search, Storage, Clipboard, WallpaperEngine │
│  schemas/   validação Zod    types/  contratos                   │
│  data/      JSON por tecnologia (import.meta.glob eager)         │
│  core/      dom(h), Store, EventBus, Component                   │
└─────────────────────────────────────────────────────────────────┘
```

## Fluxo de dados

1. **Boot** (`app.ts`): `settingsStore.init()` aplica tema/escala/CRT como `data-*` no
   `<html>`; `initWallpaperEngine()` registra o listener do WE; `content.load()` valida os
   JSONs com Zod e monta a lista achatada; `search.setIndex()` cria o índice.
2. **Estado**: `appStore` guarda `mode`, `focus`, tecnologia/categoria ativas, índices de
   seleção, buffers de busca/comando/nota. Stores são `Store<T>` com `setState`/`select`.
3. **Render**: `TerminalShell` assina *slices* do `appStore` (assinatura de string dos
   campos que afetam a UI) e re-renderiza os painéis afetados. `manualScroll` é observado
   à parte para não reconstruir a lista durante a rolagem.
4. **Entrada**: `KeyboardManager` (um único listener global) delega por modo. No NORMAL usa
   `resolveNormal()` — função **pura** (testável) que mapeia evento → ação. Overlays com
   `<input>`/`<textarea>` (busca, comando, notas) tratam a própria digitação.
5. **Ações**: `terminal/actions.ts` centraliza navegação, cópia (com confirmação de
   destrutivos), favoritar e abrir manual — reusadas por teclado, mouse e parser.

## Decisões

- **Sem framework**: menor bundle, controle total do DOM e do custo de render (seção 28).
  Re-render por reconstrução dos painéis afetados; listas longas usam `content-visibility`.
- **Enums internos em PT** (`seguro/atencao/perigoso`, `basico/…`) para manter o conteúdo
  válido; a UI mapeia risco para `[safe]/[warning]/[danger]` (`utils/risk.ts`).
- **Risco efetivo**: `effectiveRisk()` combina o risco declarado com uma heurística de
  padrões perigosos (`rm -rf`, `DROP DATABASE`, `FLUSHALL`…). O maior vence.
- **Persistência**: localStorage (settings, favoritos, histórico) e IndexedDB (notas),
  ambos com degradação segura. Prefixo `devsheet:`.
- **Pausa quando oculto**: `visibilitychange` marca `data-paused`, congelando animações e o
  relógio (seção 28).

## Idiomas (i18n)

- **Interface:** `i18n/index.ts` expõe `t(chave, params)`. Os catálogos ficam em
  `i18n/locales/<código>.ts` e são descobertos por `import.meta.glob`. O `pt-BR.ts` é a
  fonte das chaves: os demais são tipados como `Messages`, então chave faltando é erro de
  compilação (e `tests/i18n.test.ts` confere também os `{parâmetros}`).
- **Conteúdo:** os JSONs de `data/technologies/` continuam sendo a fonte (pt-BR). Traduções
  são *overlays* em `data/i18n/<código>/<tech>.json` (schema em
  `schemas/translation.schema.ts`) com só os textos. `ContentService.setLocale()` aplica o
  overlay campo a campo (vazio/ausente → pt-BR), recalcula `searchableText` no idioma e
  expõe `categoryLabel()` — a **chave** da categoria nunca muda.
- **Fluxo:** `settings.language` (`auto` ou código) → `SettingsStore.apply()` resolve com
  `resolveLocale()` (auto = `navigator.languages`, fallback inglês), chama `setLocale()` e
  emite `locale:changed` → `app.ts` re-traduz o conteúdo e reindexa a busca → a shell
  redesenha painéis e o overlay aberto.
- **Wallpaper Engine:** os rótulos do painel de propriedades usam chaves `ui_*` e o bloco
  `general.localization` do `project.json`, gerado por `scripts/we-localization.mjs`.

## Wallpaper Engine

`WallpaperEngineService` implementa `window.wallpaperPropertyListener` e mapeia cada
propriedade do `project.json` para o `SettingsStore`. Fora do WE nada acontece e os
defaults valem — a app roda igual no navegador. `setPaused` alterna `state.visible`.

## Build

Vite + `vite-plugin-singlefile` produzem `dist/index.html` com JS/CSS/dados **inline**
(`assetsInlineLimit` alto, `inlineDynamicImports`). Isso garante execução 100% offline no
CEF do Wallpaper Engine, sem caminhos relativos.

## Testes

Vitest + jsdom. `tests/setup.ts` fornece um `localStorage` em memória. Cobrem o parser
(whitelist/aliases), o teclado (`resolveNormal`, combos), a busca (score/acentos/AND),
o storage, os schemas (conteúdo real + casos inválidos) e os modos.
