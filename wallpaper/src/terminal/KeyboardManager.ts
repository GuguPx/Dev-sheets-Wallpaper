import { appStore } from '@/stores/AppStore';
import { settingsStore } from '@/stores/SettingsStore';
import { bus } from '@/core/EventBus';
import { comboFromEvent, isTypingTarget } from '@/utils/keyboard';
import { modes } from '@/terminal/ModeManager';
import { openNoteEditor } from '@/panes/NotesPane';
import type { ManualPane } from '@/panes/ManualPane';
import {
  focusedFlat,
  moveCommand,
  moveCategory,
  firstCommand,
  lastCommand,
  applyCategoryIndex,
  displayCategories,
  setFocus,
  openManualFocused,
  copyEntry,
  toggleFavorite,
  cycleTechnology,
  selectTechnologyByOrdinal,
  flatByKey,
  showIdle,
} from '@/terminal/actions';

/** Ações resolvidas a partir de um evento no modo NORMAL (pura → testável). */
export type NormalAction =
  | { t: 'move'; d: number }
  | { t: 'focus'; d: 'left' | 'right' }
  | { t: 'first' }
  | { t: 'last' }
  | { t: 'open' }
  | { t: 'copy' }
  | { t: 'fav' }
  | { t: 'note' }
  | { t: 'search' }
  | { t: 'command' }
  | { t: 'help' }
  | { t: 'theme' }
  | { t: 'tab'; n: number }
  | { t: 'idle' }
  | { t: 'cycle'; d: number }
  | { t: 'esc' }
  | null;

/**
 * Resolve o evento de teclado do modo NORMAL para uma ação, considerando a
 * tecla pendente (`gg`). Pura: não toca em DOM nem em stores (seções 5/7/18).
 */
export function resolveNormal(
  e: KeyboardEvent,
  pending: string | null,
): { action: NormalAction; pending: string | null } {
  const combo = comboFromEvent(e);
  if (combo === 'ctrl+k') return { action: { t: 'search' }, pending: null };
  if (combo === 'ctrl+tab') return { action: { t: 'cycle', d: 1 }, pending: null };
  if (combo === 'ctrl+shift+tab') return { action: { t: 'cycle', d: -1 }, pending: null };
  if (combo.startsWith('alt+')) {
    const n = Number(combo.slice(4));
    if (n >= 1 && n <= 9) return { action: { t: 'tab', n }, pending: null };
  }

  const k = e.key;
  if (pending === 'g' && k === 'g') return { action: { t: 'first' }, pending: null };

  switch (k) {
    case 'j':
    case 'ArrowDown':
      return { action: { t: 'move', d: 1 }, pending: null };
    case 'k':
    case 'ArrowUp':
      return { action: { t: 'move', d: -1 }, pending: null };
    case 'h':
    case 'ArrowLeft':
      return { action: { t: 'focus', d: 'left' }, pending: null };
    case 'l':
    case 'ArrowRight':
      return { action: { t: 'focus', d: 'right' }, pending: null };
    case 'g':
      return { action: null, pending: 'g' };
    case 'G':
      return { action: { t: 'last' }, pending: null };
    case 'Enter':
      return { action: { t: 'open' }, pending: null };
    case 'y':
      return { action: { t: 'copy' }, pending: null };
    case 'f':
      return { action: { t: 'fav' }, pending: null };
    case 'n':
      return { action: { t: 'note' }, pending: null };
    case 't':
      return { action: { t: 'theme' }, pending: null };
    case '/':
      return { action: { t: 'search' }, pending: null };
    case ':':
      return { action: { t: 'command' }, pending: null };
    case '?':
      return { action: { t: 'help' }, pending: null };
    case '0':
      return { action: { t: 'idle' }, pending: null };
    case 'Escape':
      return { action: { t: 'esc' }, pending: null };
  }
  if (/^[1-9]$/.test(k)) return { action: { t: 'tab', n: Number(k) }, pending: null };
  return { action: null, pending: null };
}

interface ShellApi {
  manual: ManualPane;
}

/**
 * Roteia o teclado conforme o modo ativo (seção 17). Nos modos com input
 * (SEARCH/COMMAND/NOTES) os próprios painéis tratam a digitação.
 */
class KeyboardManager {
  attach(shell: ShellApi): void {
    document.addEventListener('keydown', (e) => this.onKey(e, shell));
  }

  private onKey(e: KeyboardEvent, shell: ShellApi): void {
    if (!settingsStore.getState().keyboardShortcuts) return;
    const mode = modes.mode;

    // Ctrl+K abre a busca de qualquer lugar.
    if (comboFromEvent(e) === 'ctrl+k' && mode !== 'search') {
      e.preventDefault();
      modes.toSearch();
      return;
    }

    // Painéis com input tratam suas próprias teclas.
    if (mode === 'search' || mode === 'command' || mode === 'notes') return;
    if (isTypingTarget(e.target)) return;

    if (mode === 'manual') {
      this.manualKeys(e, shell.manual);
      return;
    }
    if (mode === 'help') {
      if (e.key === 'q' || e.key === 'Escape' || e.key === '?') {
        e.preventDefault();
        modes.toNormal();
      }
      return;
    }

    // NORMAL
    const { action, pending } = resolveNormal(e, appStore.getState().pendingKey);
    appStore.setState({ pendingKey: pending });
    if (!action) return;
    e.preventDefault();
    this.applyNormal(action);
  }

  private applyNormal(a: NormalAction): void {
    if (!a) return;
    const focus = appStore.getState().focus;
    switch (a.t) {
      case 'move':
        focus === 'categories' ? moveCategory(a.d) : moveCommand(a.d);
        break;
      case 'focus':
        setFocus(a.d === 'left' ? 'categories' : 'commands');
        break;
      case 'first':
        focus === 'categories' ? applyCategoryIndex(0) : firstCommand();
        break;
      case 'last':
        focus === 'categories' ? applyCategoryIndex(displayCategories().length - 1) : lastCommand();
        break;
      case 'open':
        if (focus === 'categories') setFocus('commands');
        else openManualFocused();
        break;
      case 'copy':
        void copyEntry(focusedFlat());
        break;
      case 'fav':
        toggleFavorite(focusedFlat());
        break;
      case 'note': {
        const flat = focusedFlat();
        if (flat) openNoteEditor(flat.technologyId, flat.entry.id);
        break;
      }
      case 'search':
        modes.toSearch();
        break;
      case 'command':
        modes.toCommand();
        break;
      case 'help':
        modes.toHelp();
        break;
      case 'theme':
        settingsStore.cycleTheme();
        bus.emit('toast', { message: `tema: ${settingsStore.getState().theme}`, kind: 'info' });
        break;
      case 'tab':
        selectTechnologyByOrdinal(a.n);
        break;
      case 'idle':
        showIdle();
        break;
      case 'cycle':
        cycleTechnology(a.d);
        break;
      case 'esc':
        modes.toNormal();
        break;
    }
  }

  private manualKeys(e: KeyboardEvent, manual: ManualPane): void {
    const key = e.key;
    const pending = appStore.getState().pendingKey;
    const flat = flatByKey(appStore.getState().manualKey ?? '');

    if (pending === 'g' && key === 'g') {
      appStore.setState({ pendingKey: null });
      e.preventDefault();
      manual.toStart();
      return;
    }
    appStore.setState({ pendingKey: key === 'g' ? 'g' : null });

    switch (key) {
      case 'j':
      case 'ArrowDown':
        e.preventDefault();
        manual.scrollLines(1);
        break;
      case 'k':
      case 'ArrowUp':
        e.preventDefault();
        manual.scrollLines(-1);
        break;
      case 'd':
      case 'PageDown':
      case ' ':
        e.preventDefault();
        manual.page(1);
        break;
      case 'u':
      case 'PageUp':
        e.preventDefault();
        manual.page(-1);
        break;
      case 'G':
        e.preventDefault();
        manual.toEnd();
        break;
      case 'y':
        e.preventDefault();
        void copyEntry(flat);
        break;
      case 'f':
        e.preventDefault();
        toggleFavorite(flat);
        break;
      case 'n':
        e.preventDefault();
        if (flat) openNoteEditor(flat.technologyId, flat.entry.id);
        break;
      case 'q':
      case 'Escape':
        e.preventDefault();
        modes.toNormal();
        break;
    }
  }
}

export const keyboard = new KeyboardManager();
