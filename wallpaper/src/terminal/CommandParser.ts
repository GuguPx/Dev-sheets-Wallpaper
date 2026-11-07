/**
 * Parser da linha de comando interna (seção 10).
 *
 * SEGURANÇA: é um parser PURO sobre uma whitelist. Não usa `eval`, não abre
 * shell e não toca no sistema (seção 27). Retorna uma intenção tipada que a
 * shell interpreta; nenhum efeito colateral acontece aqui.
 */

/** Lado ajustável pelo comando `margin` (margens de segurança da área de trabalho). */
export type MarginSide = 'left' | 'right' | 'bottom';

export type ParsedCommand =
  | { kind: 'empty' }
  | { kind: 'help' }
  | { kind: 'open'; tech: string }
  | { kind: 'category'; name: string }
  | { kind: 'search'; term: string }
  | { kind: 'favorites' }
  | { kind: 'history' }
  | { kind: 'notes' }
  | { kind: 'theme'; name: string }
  | { kind: 'font'; size: number }
  /** `side` nulo = lado inválido; `px` NaN = valor inválido. */
  | { kind: 'margin'; side: MarginSide | null; px: number }
  | { kind: 'clear' }
  | { kind: 'about' }
  /** `name` vazio = listar idiomas disponíveis. */
  | { kind: 'lang'; name: string }
  | { kind: 'support' }
  | { kind: 'unknown'; input: string };

/** Nome canônico -> aliases aceitos. */
export const COMMANDS: Record<string, string[]> = {
  help: ['help', '?', 'h'],
  open: ['open', 'o'],
  category: ['category', 'cat', 'c'],
  search: ['search', 's', '/'],
  favorites: ['favorites', 'favorite', 'fav', 'f'],
  history: ['history', 'recent', 'hist'],
  notes: ['notes', 'note', 'n'],
  theme: ['theme', 't'],
  font: ['font'],
  margin: ['margin', 'margem', 'm'],
  clear: ['clear', 'cls'],
  about: ['about'],
  lang: ['lang', 'language', 'idioma', 'locale'],
  support: ['support', 'donate', 'sponsor', 'coffee', 'apoiar', 'apoio'],
};

/** Aliases de lado aceitos por `margin` (PT e EN). */
const MARGIN_SIDES: Record<string, MarginSide> = {
  left: 'left',
  l: 'left',
  esq: 'left',
  esquerda: 'left',
  right: 'right',
  r: 'right',
  dir: 'right',
  direita: 'right',
  bottom: 'bottom',
  b: 'bottom',
  base: 'bottom',
  inferior: 'bottom',
};

const ALIAS_TO_CANON: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [canon, aliases] of Object.entries(COMMANDS)) {
    for (const a of aliases) map[a] = canon;
  }
  return map;
})();

/** Lista de nomes canônicos, para autocomplete/ajuda. */
export function commandNames(): string[] {
  return Object.keys(COMMANDS);
}

export function parseCommand(line: string): ParsedCommand {
  const trimmed = line.trim();
  if (!trimmed) return { kind: 'empty' };

  const parts = trimmed.split(/\s+/);
  const head = (parts[0] ?? '').toLowerCase();
  const rest = parts.slice(1).join(' ').trim();
  const canon = ALIAS_TO_CANON[head];

  switch (canon) {
    case 'help':
      return { kind: 'help' };
    case 'open':
      return { kind: 'open', tech: rest.toLowerCase() };
    case 'category':
      return { kind: 'category', name: rest };
    case 'search':
      return { kind: 'search', term: rest };
    case 'favorites':
      return { kind: 'favorites' };
    case 'history':
      return { kind: 'history' };
    case 'notes':
      return { kind: 'notes' };
    case 'theme':
      return { kind: 'theme', name: rest.toLowerCase() };
    case 'font': {
      const size = Number.parseInt(rest, 10);
      return { kind: 'font', size: Number.isFinite(size) ? size : NaN };
    }
    case 'margin': {
      const args = rest.split(/\s+/).filter(Boolean);
      // `margin 200` é atalho para a lateral esquerda (ícones da área de trabalho).
      const [rawSide, rawPx] = args.length > 1 ? args : ['left', args[0] ?? ''];
      const px = Number.parseInt(rawPx ?? '', 10);
      return {
        kind: 'margin',
        side: MARGIN_SIDES[(rawSide ?? '').toLowerCase()] ?? null,
        px: Number.isFinite(px) ? px : NaN,
      };
    }
    case 'clear':
      return { kind: 'clear' };
    case 'about':
      return { kind: 'about' };
    case 'lang':
      return { kind: 'lang', name: rest };
    case 'support':
      return { kind: 'support' };
    default:
      return { kind: 'unknown', input: trimmed };
  }
}
