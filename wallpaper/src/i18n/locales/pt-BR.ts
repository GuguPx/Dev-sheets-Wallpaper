/**
 * Catálogo-fonte da interface (pt-BR). Define TODAS as chaves: os demais
 * idiomas são tipados como `Messages` e o TypeScript acusa chave faltando.
 *
 * Convenções:
 *  - `{nome}` é um parâmetro interpolado por `t()` — não traduza o nome.
 *  - Rótulos curtos de terminal (NORMAL, [safe], y/f/n/q…) ficam fora daqui de
 *    propósito: são parte da estética e não mudam com o idioma.
 */
export const ptBR = {
  // ------------------------------ app / boot ------------------------------
  'app.noTechnologies':
    'Nenhuma tecnologia carregada. Verifique src/data/technologies e o console.',
  'app.startError': 'Erro ao iniciar: {error}',
  'boot.loadIndex': 'Loading technology index',
  'boot.loadFavorites': 'Loading local favorites',
  'boot.buildCache': 'Building search cache',
  'boot.restoreSession': 'Restoring last session',
  'boot.stats': '{commands} commands indexed · {technologies} technologies available',

  // ------------------------------ comuns ----------------------------------
  'common.all': 'todos',
  'common.empty': '— vazio —',
  'common.close': 'close',
  'common.closeEsc': 'fechar (Esc)',

  // ------------------------------ abas -------------------------------------
  'tabs.recommendedTitle': 'Recomendados / mais usados por desenvolvedores',
  'tabs.ttyTitle': 'Tela de descanso — esconde os cheat sheets (0)',

  // ------------------------------ painéis ----------------------------------
  'pane.categories': 'CATEGORIES',
  'pane.recommended': 'RECOMENDADOS · essenciais',
  'pane.noRecommended': 'Sem comandos recomendados.',
  'pane.noCommands': 'Nenhum comando nesta categoria.',
  'pane.open': 'Abrir {name}',
  'pane.details': 'DETAILS',
  'pane.example': 'EXAMPLE',
  'action.openManual': 'abrir manual',
  'action.copy': 'copiar',
  'action.copyCommand': 'copiar comando',
  'action.favorite': 'favoritar',
  'action.note': 'anotar',

  // ------------------------------ manual (man page) ------------------------
  'manual.name': 'NAME',
  'manual.synopsis': 'SYNOPSIS',
  'manual.description': 'DESCRIPTION',
  'manual.meta': 'META',
  'manual.options': 'OPTIONS',
  'manual.examples': 'EXAMPLES',
  'manual.warnings': 'WARNINGS',
  'manual.seeAlso': 'SEE ALSO',
  'manual.documentation': 'DOCUMENTATION',
  'manual.risk': 'risk',
  'manual.difficulty': 'difficulty',
  'manual.platforms': 'platforms',
  'manual.tags': 'tags',
  'difficulty.basico': 'basico',
  'difficulty.intermediario': 'intermediario',
  'difficulty.avancado': 'avancado',
  'platform.all': 'all',

  // ------------------------------ busca ------------------------------------
  'search.placeholder': 'buscar comando, tecnologia, descrição ou tag…',
  'search.aria': 'busca',
  'search.results': '{count} results',
  'search.typeToSearch': 'digite para buscar…',
  'search.noResults': 'nenhum resultado',

  // ------------------------------ statusline -------------------------------
  'status.query': 'query: {query}',
  'status.select': 'select',
  'status.open': 'open',
  'status.close': 'close',
  'status.scroll': 'scroll',
  'status.copy': 'copy',
  'status.fav': 'fav',
  'status.note': 'note',
  'status.run': 'run',
  'status.cancel': 'cancel',
  'status.internalCommand': 'comando interno',
  'status.editingNote': 'editando nota',
  'status.save': 'salvar',
  'status.cancelNote': 'cancelar',
  'status.shortcuts': 'atalhos',
  'status.closeHelp': 'fechar',
  'status.idle': 'tela de descanso',
  'status.sheetsHidden': 'sheets ocultos',
  'status.idleWakeMouse': 'mexa o mouse para voltar',
  'status.idleWakeClick': 'clique numa aba para voltar',
  'status.recommended': 'recomendados',
  'status.essentials': 'essenciais',
  'status.search': 'search',
  'status.cmd': 'cmd',
  'status.help': 'help',

  // ------------------------------ linha de comando -------------------------
  'cmdline.aria': 'comando interno',
  'cmdline.title': 'abrir linha de comando (:)',
  'cmdline.hint': 'digite : para comandos internos · / para buscar',

  // ------------------------------ toasts -----------------------------------
  'toast.loadingSheet': 'Loading sheet: {tech}…',
  'toast.techNotFound': 'tecnologia não encontrada: {tech}',
  'toast.categoryNotFound': 'categoria não encontrada: {name}',
  'toast.theme': 'tema: {name}',
  'toast.themeInvalid': 'tema inválido: {name}',
  'toast.font': 'fonte: {size}px',
  'toast.fontInvalid': 'tamanho de fonte inválido (8–40)',
  'toast.marginSideInvalid': 'lado inválido — use left, right ou bottom',
  'toast.marginInvalid': 'margem inválida (0–600px)',
  'toast.margin': 'margem {side}: {px}px',
  'toast.language': 'idioma: {name}',
  'toast.languageInvalid': 'idioma inválido: {name} — use {list}',
  'toast.unknownCommand': 'comando desconhecido: {input} — digite "help"',
  'toast.copied': '[ copied ] {command}',
  'toast.copyCancelled': 'cópia cancelada',
  'toast.copyFailed': 'falha ao copiar',
  'toast.favorited': '★ favoritado: {command}',
  'toast.unfavorited': '☆ removido: {command}',
  'toast.noteSaved': '[ nota salva ]',
  'margin.left': 'esquerda',
  'margin.right': 'direita',
  'margin.bottom': 'base',

  // ------------------------------ overlays ---------------------------------
  'info.favorites': 'FAVORITES',
  'info.history': 'HISTORY',
  'info.notes': 'NOTES',
  'info.about': 'ABOUT',
  'info.support': 'SUPPORT ♥',
  'about.tagline': 'devsheet — terminal de consulta de cheat sheets (dev & DevOps).',
  'about.offline': 'Consulta, busca e cópia 100% offline. Nenhum comando é executado.',
  'about.storage': 'Favoritos e histórico em localStorage; notas em IndexedDB.',
  'about.stats': '{commands} comandos · {technologies} tecnologias',
  'about.builtWith': 'Feito com TypeScript puro + Vite para o Wallpaper Engine.',
  'about.supportHint': '♥ Gostou? Digite :support para apoiar o autor.',
  'confirm.title': 'WARNING: destructive command',
  'confirm.generic': 'Este comando pode ser destrutivo. Copie com cautela.',
  'confirm.hint': 'Press Y again to copy · Esc to cancel',
  'notes.head': 'NOTE: {command}',
  'notes.aria': 'conteúdo da nota',
  'notes.save': 'salvar',
  'notes.cancel': 'cancelar',

  // ------------------------------ apoio (support) --------------------------
  'support.intro':
    'Oi! Sou o Augusto, um desenvolvedor brasileiro que mora no interior da Bahia. O devsheet é gratuito e feito no meu tempo livre.',
  'support.currency':
    'Aqui o real (BRL) vale bem menos que o dólar — US$ 1 dá cerca de R$ 5 —, então qualquer ajuda, por menor que seja, faz muita diferença.',
  'support.thanks':
    'Seu apoio me fortalece a produzir mais wallpapers incríveis como este. Muito obrigado!',
  'support.links': 'Como apoiar (clique para copiar o link):',
  'support.copied': '[ link copiado ] {url}',
  'support.noLinks': '(links de apoio ainda não configurados)',

  // ------------------------------ ajuda ------------------------------------
  'help.title': 'KEYBINDINGS',
  'help.navigation': 'NAVIGATION',
  'help.tabs': 'TABS (tecnologias)',
  'help.searchCommand': 'SEARCH / COMMAND',
  'help.actions': 'ACTIONS',
  'help.manual': 'MANUAL (man page)',
  'help.nextItem': 'Próximo item',
  'help.prevItem': 'Item anterior',
  'help.focusCategories': 'Foco: categorias',
  'help.focusCommands': 'Foco: comandos',
  'help.firstItem': 'Primeiro item',
  'help.lastItem': 'Último item',
  'help.openManual': 'Abrir manual do comando',
  'help.back': 'Voltar / modo NORMAL',
  'help.selectTech': 'Selecionar tecnologia',
  'help.nextTech': 'Próxima tecnologia',
  'help.prevTech': 'Tecnologia anterior',
  'help.search': 'Buscar (FZF)',
  'help.palette': 'Buscar (palette)',
  'help.commandLine': 'Linha de comando interna',
  'help.thisHelp': 'Esta ajuda',
  'help.copy': 'Copiar comando',
  'help.favorite': 'Favoritar / desfavoritar',
  'help.note': 'Adicionar/editar nota',
  'help.theme': 'Alternar tema',
  'help.scroll': 'Rolar',
  'help.page': 'Página',
  'help.startEnd': 'Início / fim',
  'help.close': 'Fechar',
  'help.language': 'Trocar idioma (:lang en)',
  'help.support': 'Apoiar o autor (:support)',
  'help.footer': 'devsheet — consulta offline. Nenhum comando é executado.',

  // ------------------------------ tty (descanso) ---------------------------
  'idle.title': 'TTY · tela de descanso',
  'idle.fictional': 'saída fictícia',
  'idle.banner': 'sessão ociosa — sheets ocultos',
} as const;

export type MessageKey = keyof typeof ptBR;
export type Messages = { readonly [K in MessageKey]: string };
