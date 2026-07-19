import { h } from '@/core/dom';
import { appStore } from '@/stores/AppStore';
import { settingsStore } from '@/stores/SettingsStore';
import { favoritesStore } from '@/stores/FavoritesStore';
import { notesStore } from '@/stores/NotesStore';
import { historyStore } from '@/stores/HistoryStore';
import { bus } from '@/core/EventBus';
import { content } from '@/services/ContentService';
import { normalize } from '@/utils/normalize';
import { pad2, timeLabel, titleCase } from '@/utils/format';
import { modes } from '@/terminal/ModeManager';
import { parseCommand } from '@/terminal/CommandParser';
import {
  selectTechnology,
  displayCategories,
  applyCategoryIndex,
  ALL_CATEGORY,
} from '@/terminal/actions';

/** Sobe a árvore a partir do alvo até achar um contêiner que possa rolar. */
function scrollableUnder(target: Node | null): HTMLElement | null {
  let el: HTMLElement | null =
    target instanceof HTMLElement ? target : (target?.parentElement ?? null);
  while (el && el !== document.body) {
    const oy = getComputedStyle(el).overflowY;
    if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 1) return el;
    el = el.parentElement;
  }
  return null;
}

import { TechnologyTabs } from '@/panes/TechnologyTabs';
import { CommandPane } from '@/panes/CommandPane';
import { IdlePane } from '@/panes/IdlePane';
import { DetailsPane } from '@/panes/DetailsPane';
import { StatusLine } from '@/panes/StatusLine';
import { CommandLine } from '@/panes/CommandLine';
import { ManualPane } from '@/panes/ManualPane';
import { SearchPane } from '@/panes/SearchPane';
import { HelpPane } from '@/panes/HelpPane';
import { NotesPane } from '@/panes/NotesPane';
import { showInfo } from '@/panes/InfoOverlay';

/**
 * Orquestra o layout estilo Tmux (seção 4): abas no topo, grade de painéis
 * (categorias | comandos | detalhes), linha de comando e statusline. Monta os
 * overlays (busca/manual/ajuda/notas) e mantém tudo sincronizado com o estado.
 */
export class TerminalShell {
  private readonly tabs = new TechnologyTabs();
  private readonly commands = new CommandPane();
  private readonly idle = new IdlePane();
  private readonly details = new DetailsPane();
  private readonly statusline = new StatusLine();
  private readonly commandline = new CommandLine();
  readonly manual = new ManualPane();
  private readonly searchPane = new SearchPane();
  private readonly helpPane = new HelpPane();
  private readonly notesPane = new NotesPane();

  private readonly mainEl = h('div', { class: 'term-main' });
  private readonly frame = h('div', { class: 'term-frame' });
  private clockTimer = 0;

  mount(root: HTMLElement): void {
    this.mainEl.append(this.commands.el, this.idle.el, this.details.el);
    this.frame.append(this.tabs.el, this.mainEl, this.commandline.el, this.statusline.el);
    const term = h('div', { class: 'term' }, this.frame);
    root.appendChild(term);

    const overlayRoot = document.getElementById('overlay-root');
    if (overlayRoot) {
      overlayRoot.append(this.searchPane.el, this.manual.el, this.helpPane.el, this.notesPane.el);
    }

    this.wire();
    this.renderMain();
    this.renderStatus();
    this.applyLayout();
    this.syncOverlay();
    this.startClock();
    this.attachWheelScroll();
  }

  /**
   * Rola manualmente o contêiner sob o cursor. No Wallpaper Engine (CEF) a roda
   * do mouse muitas vezes não rola contêineres com overflow aninhado de forma
   * automática; aqui garantimos o scroll sem duplicar no navegador comum
   * (só chamamos preventDefault quando de fato rolamos).
   */
  private attachWheelScroll(): void {
    window.addEventListener(
      'wheel',
      (e: WheelEvent) => {
        const el = scrollableUnder(e.target as Node | null);
        if (!el) return;
        const factor = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientHeight : 1;
        const before = el.scrollTop;
        el.scrollTop = before + e.deltaY * factor;
        if (el.scrollTop !== before) e.preventDefault();
      },
      { passive: false },
    );
  }

  private renderMain(): void {
    this.tabs.render();
    // applyLayout antes do start: a tela de descanso decide o número de colunas
    // pela largura do painel, que só é real depois do display ser aplicado.
    this.applyLayout();
    // Na aba "tty" o painel de comandos fica oculto e nem é re-renderizado;
    // a animação assume o lugar (start/stop são idempotentes).
    if (appStore.getState().idleView) {
      this.idle.start();
    } else {
      this.idle.stop();
      this.commands.render();
      this.details.render();
    }
    this.commandline.render();
  }

  private renderStatus(): void {
    this.statusline.render();
  }

  private applyLayout(): void {
    const s = settingsStore.getState();
    const idle = appStore.getState().idleView;
    this.tabs.el.style.display = s.showTabs ? '' : 'none';
    this.commands.el.style.display = idle ? 'none' : '';
    this.idle.el.style.display = idle ? '' : 'none';
    this.details.el.style.display = !idle && s.showDetailsPane ? '' : 'none';
    this.commandline.el.style.display = s.showCommandLine ? '' : 'none';
    this.statusline.el.style.display = s.showStatusBar ? '' : 'none';

    // Sem menu lateral: comandos ocupam a largura; detalhes é opcional.
    // A tela de descanso é sempre coluna única.
    const cols = idle
      ? 'minmax(0, 1fr)'
      : ['minmax(0, 1fr)', s.showDetailsPane ? 'minmax(240px, 340px)' : null]
          .filter(Boolean)
          .join(' ');
    this.mainEl.style.gridTemplateColumns = cols;
  }

  private syncOverlay(): void {
    const mode = appStore.getState().mode;
    this.searchPane.el.style.display = mode === 'search' ? '' : 'none';
    this.manual.el.style.display = mode === 'manual' ? '' : 'none';
    this.helpPane.el.style.display = mode === 'help' ? '' : 'none';
    this.notesPane.el.style.display = mode === 'notes' ? '' : 'none';

    if (mode === 'search') {
      this.searchPane.render();
      this.searchPane.focusInput();
    } else if (mode === 'manual') {
      this.manual.render();
    } else if (mode === 'help') {
      this.helpPane.render();
    } else if (mode === 'notes') {
      this.notesPane.render();
      this.notesPane.focusInput();
    } else if (mode === 'command') {
      this.commandline.focusInput();
    }
  }

  private wire(): void {
    appStore.select(
      (s) =>
        `${s.recommendedView}|${s.idleView}|${s.idleAuto}|${s.activeTechnologyId}|${s.activeCategory}|${s.commandIndex}|${s.categoryIndex}|${s.focus}|${s.mode}`,
      () => {
        this.renderMain();
        this.renderStatus();
        this.syncOverlay();
      },
    );
    appStore.select(
      (s) => s.manualScroll,
      () => this.renderStatus(),
    );
    settingsStore.subscribe(() => {
      this.applyLayout();
      this.renderMain();
      this.renderStatus();
    });
    bus.on('favorites:changed', () => this.renderMain());
    bus.on('notes:changed', () => this.renderMain());
    bus.on('render', () => {
      this.renderMain();
      this.renderStatus();
    });
    bus.on('command:submit', ({ line }) => this.runCommand(line));
  }

  private startClock(): void {
    this.clockTimer = window.setInterval(() => {
      if (appStore.getState().visible && settingsStore.getState().showClock) {
        this.renderStatus();
      }
    }, 1000);
  }

  destroy(): void {
    window.clearInterval(this.clockTimer);
  }

  // ------------------------------ comandos ---------------------------------

  private runCommand(line: string): void {
    const p = parseCommand(line);
    const done = () => {
      appStore.setState({ commandLine: '' });
      modes.toNormal();
    };

    switch (p.kind) {
      case 'empty':
        done();
        break;
      case 'help':
        appStore.setState({ commandLine: '' });
        modes.toHelp();
        break;
      case 'open': {
        if (content.getTechnology(p.tech)) {
          selectTechnology(p.tech);
          bus.emit('toast', { message: `Loading sheet: ${p.tech}…`, kind: 'info' });
        } else {
          bus.emit('toast', { message: `tecnologia não encontrada: ${p.tech}`, kind: 'warning' });
        }
        done();
        break;
      }
      case 'category': {
        const cats = displayCategories();
        const target = normalize(p.name);
        const idx = cats.findIndex(
          (c) =>
            c !== ALL_CATEGORY && (normalize(c) === target || normalize(titleCase(c)) === target),
        );
        if (idx >= 0) applyCategoryIndex(idx);
        else bus.emit('toast', { message: `categoria não encontrada: ${p.name}`, kind: 'warning' });
        done();
        break;
      }
      case 'search':
        appStore.setState({ commandLine: '', searchQuery: p.term, searchIndex: 0 });
        modes.toSearch();
        break;
      case 'favorites':
        appStore.setState({ commandLine: '' });
        modes.toNormal();
        this.showFavorites();
        break;
      case 'history':
        appStore.setState({ commandLine: '' });
        modes.toNormal();
        this.showHistory();
        break;
      case 'notes':
        appStore.setState({ commandLine: '' });
        modes.toNormal();
        this.showNotes();
        break;
      case 'theme': {
        const ok = settingsStore.setTheme(p.name);
        bus.emit('toast', {
          message: ok ? `tema: ${p.name}` : `tema inválido: ${p.name}`,
          kind: ok ? 'info' : 'warning',
        });
        done();
        break;
      }
      case 'font': {
        if (Number.isFinite(p.size) && p.size >= 8 && p.size <= 40) {
          settingsStore.set({ fontScale: Number((p.size / 15).toFixed(3)) });
          bus.emit('toast', { message: `fonte: ${p.size}px`, kind: 'info' });
        } else {
          bus.emit('toast', { message: 'tamanho de fonte inválido (8–40)', kind: 'warning' });
        }
        done();
        break;
      }
      case 'margin': {
        if (!p.side) {
          bus.emit('toast', {
            message: 'lado inválido — use left, right ou bottom',
            kind: 'warning',
          });
        } else if (!Number.isFinite(p.px) || p.px < 0 || p.px > 600) {
          bus.emit('toast', { message: 'margem inválida (0–600px)', kind: 'warning' });
        } else {
          settingsStore.set(
            p.side === 'left'
              ? { safeLeft: p.px }
              : p.side === 'right'
                ? { safeRight: p.px }
                : { safeBottom: p.px },
          );
          const label = { left: 'esquerda', right: 'direita', bottom: 'base' }[p.side];
          bus.emit('toast', { message: `margem ${label}: ${p.px}px`, kind: 'info' });
        }
        done();
        break;
      }
      case 'clear':
        appStore.setState({ commandLine: '', commandIndex: 0 });
        modes.toNormal();
        break;
      case 'about':
        appStore.setState({ commandLine: '' });
        modes.toNormal();
        this.showAbout();
        break;
      case 'unknown':
        bus.emit('toast', {
          message: `comando desconhecido: ${p.input} — digite "help"`,
          kind: 'warning',
        });
        break;
    }
  }

  private showFavorites(): void {
    const lines = favoritesStore.list().map((f, i) => {
      const flat = content.getEntryByKey(f.key);
      const short = flat ? flat.technologyShortName : f.technologyId;
      const cmd = flat ? flat.entry.command : f.entryId;
      return `${pad2(i + 1)}  [${short}]  ${cmd}`;
    });
    showInfo('FAVORITES', lines);
  }

  private showHistory(): void {
    const lines = historyStore
      .recentActivity(40)
      .map((a) => `${timeLabel(a.at)}  ${a.kind} ${a.label}`);
    showInfo('HISTORY', lines);
  }

  private showNotes(): void {
    const lines = notesStore
      .search('')
      .filter((n) => n.content.trim())
      .map((n) => {
        const flat =
          n.technologyId && n.entryId ? content.getEntry(n.technologyId, n.entryId) : undefined;
        const head = flat ? `[${flat.technologyShortName}] ${flat.entry.command}` : n.title;
        const excerpt = n.content.replace(/\s+/g, ' ').slice(0, 60);
        return `${head} — ${excerpt}`;
      });
    showInfo('NOTES', lines);
  }

  private showAbout(): void {
    showInfo('ABOUT', [
      'devsheet — terminal de consulta de cheat sheets (dev & DevOps).',
      '',
      'Consulta, busca e cópia 100% offline. Nenhum comando é executado.',
      'Favoritos e histórico em localStorage; notas em IndexedDB.',
      '',
      `${content.totalEntries} comandos · ${content.totalTechnologies} tecnologias`,
      'Feito com TypeScript puro + Vite para o Wallpaper Engine.',
    ]);
  }
}
