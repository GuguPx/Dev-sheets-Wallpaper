/**
 * Ações compartilhadas entre teclado (KeyboardManager), mouse (panes) e a linha
 * de comando (CommandParser). Centraliza navegação, cópia segura e favoritos
 * para evitar duplicação. Nenhuma ação executa comandos do sistema (seção 27).
 */
import { content, ContentService } from '@/services/ContentService';
import { appStore } from '@/stores/AppStore';
import { settingsStore } from '@/stores/SettingsStore';
import { favoritesStore } from '@/stores/FavoritesStore';
import { historyStore } from '@/stores/HistoryStore';
import { bus } from '@/core/EventBus';
import { copyToClipboard } from '@/services/ClipboardService';
import { isDestructive } from '@/utils/risk';
import { modes } from '@/terminal/ModeManager';
import { confirmDanger } from '@/panes/ConfirmOverlay';
import { t } from '@/i18n';
import type { CheatEntry, EntryKey, FlatEntry, Technology } from '@/types';

/** Categoria sintética "todos" (primeiro item da CategoryPane). */
export const ALL_CATEGORY = '__all__';

// --------------------------- seletores de estado ---------------------------

export function visibleTechnologies(): Technology[] {
  const s = settingsStore.getState();
  const hidden = new Set(s.hiddenTechnologies);
  const shown = content.getTechnologies().filter((t) => !hidden.has(t.id));
  const fav = s.favoriteTechnologies
    .map((id) => shown.find((t) => t.id === id))
    .filter((t): t is Technology => Boolean(t));
  const favIds = new Set(fav.map((t) => t.id));
  const rest = shown.filter((t) => !favIds.has(t.id));
  return [...fav, ...rest];
}

export function activeTechnology(): Technology | undefined {
  return content.getTechnology(appStore.getState().activeTechnologyId);
}

/** Lista de categorias exibidas (com a pseudo-categoria "todos" no início). */
export function displayCategories(tech = activeTechnology()): string[] {
  if (!tech) return [ALL_CATEGORY];
  return [ALL_CATEGORY, ...tech.categories];
}

/**
 * Comandos "recomendados / mais usados por desenvolvedores": os de dificuldade
 * **básica** (essenciais do dia a dia), agregados de todas as tecnologias
 * visíveis e mantidos agrupados por tecnologia (ordem das abas).
 */
export function recommendedFlat(): FlatEntry[] {
  const out: FlatEntry[] = [];
  for (const t of visibleTechnologies()) {
    for (const e of t.entries) {
      if (e.difficulty === 'basico') {
        out.push({
          entry: e,
          technologyId: t.id,
          technologyName: t.name,
          technologyShortName: t.shortName,
          technologyColor: t.color,
        });
      }
    }
  }
  return out;
}

export function currentEntries(): CheatEntry[] {
  const st = appStore.getState();
  if (st.recommendedView) return recommendedFlat().map((f) => f.entry);
  return content.entriesFor(st.activeTechnologyId, st.activeCategory);
}

export function focusedFlat(): FlatEntry | null {
  const st = appStore.getState();
  if (st.recommendedView) return recommendedFlat()[st.commandIndex] ?? null;
  const entry = currentEntries()[st.commandIndex];
  if (!entry) return null;
  return content.getEntry(st.activeTechnologyId, entry.id) ?? null;
}

/** Volta para a visão inicial "Recomendados / mais usados". */
export function showRecommended(): void {
  appStore.setState({
    recommendedView: true,
    idleView: false,
    idleAuto: false,
    activeCategory: null,
    categoryIndex: 0,
    commandIndex: 0,
    focus: 'commands',
  });
  emitFocus();
  bus.emit('render');
}

/**
 * Abre a aba "tty" (tela de descanso) por escolha do usuário. `idleAuto: false`
 * faz ela ficar até outra aba ser clicada — mexer o mouse não tira (compare com
 * a entrada automática por inatividade, em `IdleTimer`).
 */
export function showIdle(): void {
  appStore.setState({ idleView: true, idleAuto: false, recommendedView: false, focus: 'commands' });
  bus.emit('render');
}

export function flatByKey(key: EntryKey): FlatEntry | null {
  return content.getEntryByKey(key) ?? null;
}

function clamp(i: number, len: number): number {
  if (len <= 0) return 0;
  return Math.max(0, Math.min(i, len - 1));
}

// ------------------------------- navegação --------------------------------

export function selectTechnology(id: string, log = true): void {
  const tech = content.getTechnology(id);
  if (!tech) {
    bus.emit('toast', { message: t('toast.techNotFound', { tech: id }), kind: 'warning' });
    return;
  }
  appStore.setState({
    activeTechnologyId: id,
    recommendedView: false,
    idleView: false,
    idleAuto: false,
    activeCategory: null,
    categoryIndex: 0,
    commandIndex: 0,
    focus: 'commands',
  });
  if (log && settingsStore.getState().enableHistory) {
    historyStore.logActivity({ at: Date.now(), kind: 'open', label: `open ${id}` });
  }
  emitFocus();
  bus.emit('render');
}

export function cycleTechnology(dir: number): void {
  const techs = visibleTechnologies();
  if (!techs.length) return;
  const idx = techs.findIndex((t) => t.id === appStore.getState().activeTechnologyId);
  const next = techs[(idx + dir + techs.length) % techs.length];
  selectTechnology(next.id);
}

/** Seleciona tecnologia por posição (tecla 1..9). */
export function selectTechnologyByOrdinal(n: number): void {
  const techs = visibleTechnologies();
  const t = techs[n - 1];
  if (t) selectTechnology(t.id);
}

export function moveCategory(dir: number): void {
  const cats = displayCategories();
  const i = clamp(appStore.getState().categoryIndex + dir, cats.length);
  applyCategoryIndex(i);
}

export function applyCategoryIndex(i: number): void {
  const cats = displayCategories();
  const cat = cats[i];
  appStore.setState({
    categoryIndex: i,
    activeCategory: cat === ALL_CATEGORY ? null : cat,
    commandIndex: 0,
    focus: 'categories',
  });
  emitFocus();
  bus.emit('render');
}

export function moveCommand(dir: number): void {
  const entries = currentEntries();
  const i = clamp(appStore.getState().commandIndex + dir, entries.length);
  appStore.setState({ commandIndex: i, focus: 'commands' });
  emitFocus();
  bus.emit('render');
}

export function firstCommand(): void {
  appStore.setState({ commandIndex: 0, focus: 'commands' });
  emitFocus();
  bus.emit('render');
}

export function lastCommand(): void {
  const entries = currentEntries();
  appStore.setState({ commandIndex: Math.max(0, entries.length - 1), focus: 'commands' });
  emitFocus();
  bus.emit('render');
}

export function setFocus(focus: 'tabs' | 'categories' | 'commands'): void {
  appStore.setState({ focus });
  bus.emit('render');
}

function emitFocus(): void {
  const flat = focusedFlat();
  bus.emit('entry:focus', {
    key: flat ? ContentService.key(flat.technologyId, flat.entry.id) : null,
  });
}

// --------------------------------- ações ----------------------------------

export function openManualFocused(): void {
  const flat = focusedFlat();
  if (!flat) return;
  const key = ContentService.key(flat.technologyId, flat.entry.id);
  modes.toManual(key);
  bus.emit('entry:used', {
    technologyId: flat.technologyId,
    entryId: flat.entry.id,
    action: 'open',
  });
}

export function openManual(flat: FlatEntry): void {
  const key = ContentService.key(flat.technologyId, flat.entry.id);
  modes.toManual(key);
  bus.emit('entry:used', {
    technologyId: flat.technologyId,
    entryId: flat.entry.id,
    action: 'open',
  });
}

/** Copia um comando; se destrutivo, exige dupla confirmação (seção 14). */
export async function copyEntry(flat: FlatEntry | null): Promise<void> {
  if (!flat) return;
  const cmd = flat.entry.command;
  if (isDestructive(flat.entry.risk)) {
    const ok = await confirmDanger(cmd, flat.entry.warnings);
    if (!ok) {
      bus.emit('toast', { message: t('toast.copyCancelled'), kind: 'info' });
      return;
    }
  }
  const ok = await copyToClipboard(cmd);
  if (ok) {
    bus.emit('toast', { message: t('toast.copied', { command: cmd }), kind: 'success' });
    bus.emit('entry:used', {
      technologyId: flat.technologyId,
      entryId: flat.entry.id,
      action: 'copy',
    });
  } else {
    bus.emit('toast', { message: t('toast.copyFailed'), kind: 'danger' });
  }
}

export function toggleFavorite(flat: FlatEntry | null): void {
  if (!flat) return;
  const added = favoritesStore.toggle(flat.technologyId, flat.entry.id);
  bus.emit('toast', {
    message: t(added ? 'toast.favorited' : 'toast.unfavorited', { command: flat.entry.command }),
    kind: 'info',
  });
  if (added) {
    bus.emit('entry:used', {
      technologyId: flat.technologyId,
      entryId: flat.entry.id,
      action: 'favorite',
    });
  }
  bus.emit('render');
}
