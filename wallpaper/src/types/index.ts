/**
 * Tipos centrais do devsheet.
 *
 * A fonte da verdade para validação de conteúdo são os schemas Zod em
 * `src/schemas`. Estes tipos são alinhados a eles e usados em toda a aplicação.
 *
 * Nota de idioma: os enums internos (risco/dificuldade) ficam em PT para manter
 * o conteúdo já existente válido; a camada de exibição do terminal mapeia risco
 * para os rótulos [safe]/[warning]/[danger] (ver `utils/risk.ts`).
 */

// ---------------------------------------------------------------------------
// Conteúdo (cheat sheets)
// ---------------------------------------------------------------------------

export type Difficulty = 'basico' | 'intermediario' | 'avancado';

export type Platform = 'linux' | 'macos' | 'windows' | 'all';

/** Classificação de risco de um comando (seção 15 da spec). */
export type RiskLevel = 'seguro' | 'atencao' | 'perigoso';

export type ExampleLevel = 'basico' | 'intermediario' | 'avancado';

export interface CheatExample {
  level: ExampleLevel;
  code: string;
  explanation: string;
  /** Resultado esperado da execução (opcional, apenas ilustrativo). */
  expected?: string;
}

export interface CommandArgument {
  flag: string;
  description: string;
  /** Se o argumento é opcional (default: true). */
  optional?: boolean;
}

export interface CheatEntry {
  id: string;
  title: string;
  command: string;
  description: string;
  category: string;
  tags: string[];
  difficulty: Difficulty;
  platforms: Platform[];
  risk: RiskLevel;
  examples: CheatExample[];
  arguments: CommandArgument[];
  warnings: string[];
  relatedCommands: string[];
  documentationUrl?: string;
  /** Texto derivado (normalizado, sem acento) para indexação de busca. */
  searchableText?: string;
}

export interface Technology {
  id: string;
  name: string;
  shortName: string;
  /** Prompt exibido na linha de comando (ex.: "git"). Deriva de shortName/id. */
  prompt: string;
  /** Chave de ícone/glifo textual. */
  icon: string;
  /** Cor de acento da tecnologia (hex). */
  color: string;
  description: string;
  documentationUrl: string;
  version: string;
  /** ISO date (YYYY-MM-DD) da última revisão de conteúdo. */
  lastReviewedAt: string;
  categories: string[];
  entries: CheatEntry[];
}

/** Entrada achatada com referência à tecnologia, usada em busca e listas globais. */
export interface FlatEntry {
  entry: CheatEntry;
  technologyId: string;
  technologyName: string;
  technologyShortName: string;
  technologyColor: string;
}

// ---------------------------------------------------------------------------
// Estado do terminal (modos, foco, seleção)
// ---------------------------------------------------------------------------

/** Modos estilo Vim (seção 17). */
export type Mode = 'normal' | 'search' | 'command' | 'manual' | 'notes' | 'help';

/** Painel com foco no modo NORMAL. */
export type Focus = 'tabs' | 'categories' | 'commands';

/** Chave composta tech:entry para identificar um comando globalmente. */
export type EntryKey = string;

export interface AppState {
  mode: Mode;
  focus: Focus;
  activeTechnologyId: string;
  /** Visão inicial "Recomendados / mais usados" (essenciais, agregados por tecnologia). */
  recommendedView: boolean;
  /** Aba "tty": tela de descanso que esconde os sheets. Exclusiva com as demais. */
  idleView: boolean;
  /** true quando a tela de descanso entrou por inatividade (acorda ao interagir). */
  idleAuto: boolean;
  /** Categoria ativa; null = todas as categorias da tecnologia. */
  activeCategory: string | null;
  /** Índice do comando selecionado dentro da lista filtrada. */
  commandIndex: number;
  /** Índice da categoria selecionada. */
  categoryIndex: number;
  /** Comando aberto no manual (man page) ou null. */
  manualKey: EntryKey | null;
  /** Progresso de rolagem do manual (0..1). */
  manualScroll: number;
  /** Consulta atual da busca (modo SEARCH). */
  searchQuery: string;
  /** Índice do resultado selecionado na busca. */
  searchIndex: number;
  /** Buffer da linha de comando interna (modo COMMAND). */
  commandLine: string;
  /** Rascunho da nota em edição (modo NOTES). */
  noteDraft: string;
  /** Comando alvo da nota em edição. */
  noteEntryKey: EntryKey | null;
  /** Sequência pendente (ex.: "g" aguardando "g" para "gg"). */
  pendingKey: string | null;
  /** Já passou pela sequência de boot. */
  booted: boolean;
  /** Documento visível/ativo (para pausar animações). */
  visible: boolean;
}

// ---------------------------------------------------------------------------
// Persistência / configurações
// ---------------------------------------------------------------------------

export type ThemeName =
  'graphite' | 'ice' | 'mint' | 'amber' | 'violet' | 'vscode' | 'caderno' | 'classic-green';

export type Language = 'pt-BR' | 'en';

/** Nível de qualidade do efeito CRT (seção 21). */
export type CrtLevel = 'off' | 'low' | 'balanced' | 'high';

/** Densidade de linhas da lista de comandos (seção 26). */
export type Density = 'compact' | 'normal' | 'relaxed';

export interface Settings {
  theme: ThemeName;
  language: Language;
  /** Usuário exibido no prompt (ex.: "augusto@devsheet"). */
  username: string;
  initialTechnology: string;
  /** Família de fonte monoespaçada (vazio = padrão do tema). */
  fontFamily: string;
  fontScale: number;
  uiScale: number;
  /** Margem inferior (px) para o conteúdo não ficar atrás da barra de tarefas. */
  safeBottom: number;
  /** Margem esquerda (px) para o conteúdo não cobrir os ícones da área de trabalho. */
  safeLeft: number;
  /** Margem direita (px) para o conteúdo não cobrir os ícones da área de trabalho. */
  safeRight: number;
  /** Minutos sem interação até abrir a tela de descanso (0 = desligado). */
  idleTimeout: number;

  // Efeitos CRT (seção 21) — sutis por padrão.
  crtLevel: CrtLevel;
  scanlines: boolean;
  flicker: boolean;
  noise: boolean;
  glow: boolean;
  vignette: boolean;
  chromatic: boolean;
  curvature: boolean;

  /** Sequência de inicialização (seção 22). */
  bootAnimation: boolean;

  showClock: boolean;
  clock24h: boolean;

  // Painéis (seção 4/26).
  showTabs: boolean;
  showCategoryPane: boolean;
  showDetailsPane: boolean;
  showCommandLine: boolean;
  showStatusBar: boolean;

  /** Registro de histórico local (seção 13). */
  enableHistory: boolean;
  /** Exibir marcadores de favorito (seção 12). */
  showFavorites: boolean;

  /** Máximo de linhas de comando visíveis (0 = automático). */
  lines: number;
  density: Density;

  maxFps: number;
  reducedMotion: boolean;
  keyboardShortcuts: boolean;
  /** Realce de sintaxe (estilo VS Code) nos comandos. */
  syntaxHighlight: boolean;

  accentColor: string;

  /** Tecnologias fixadas no início das abas. */
  favoriteTechnologies: string[];
  /** Tecnologias ocultas das abas. */
  hiddenTechnologies: string[];
}

export interface FavoriteItem {
  key: EntryKey;
  technologyId: string;
  entryId: string;
  addedAt: number;
}

export type UsageAction = 'open' | 'copy' | 'favorite' | 'search-select';

export interface UsageStat {
  key: EntryKey;
  technologyId: string;
  entryId: string;
  score: number;
  opens: number;
  copies: number;
  favorites: number;
  searchSelects: number;
  lastUsedAt: number;
}

export interface HistoryEntry {
  key: EntryKey;
  technologyId: string;
  entryId: string;
  action: UsageAction;
  at: number;
}

/** Log de atividade legível para o comando `history` (seção 13). */
export type ActivityKind = 'open' | 'view' | 'copy' | 'search' | 'favorite';

export interface ActivityItem {
  at: number;
  kind: ActivityKind;
  label: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  technologyId?: string;
  entryId?: string;
  category?: string;
  favorite: boolean;
}
