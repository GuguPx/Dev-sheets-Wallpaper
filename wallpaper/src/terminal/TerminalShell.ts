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
import { showInfo, type InfoLine } from '@/panes/InfoOverlay';
import { t, LANGUAGES, languageName, resolveLocale } from '@/i18n';
import { activeSupportLinks } from '@/config/support';
import { EDITOR_URL, REPO_URL } from '@/config/links';
import { copyToClipboard } from '@/services/ClipboardService';

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
    // Troca de idioma: o conteúdo já foi re-traduzido (app.ts); redesenha tudo,
    // inclusive o overlay aberto (busca/manual/ajuda).
    bus.on('locale:changed', () => {
      this.renderMain();
      this.renderStatus();
      this.syncOverlay();
    });
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
          bus.emit('toast', { message: t('toast.loadingSheet', { tech: p.tech }), kind: 'info' });
        } else {
          bus.emit('toast', {
            message: t('toast.techNotFound', { tech: p.tech }),
            kind: 'warning',
          });
        }
        done();
        break;
      }
      case 'category': {
        const cats = displayCategories();
        const target = normalize(p.name);
        const techId = appStore.getState().activeTechnologyId;
        const idx = cats.findIndex(
          (c) =>
            c !== ALL_CATEGORY &&
            (normalize(c) === target ||
              normalize(titleCase(c)) === target ||
              normalize(content.categoryLabel(techId, c)) === target),
        );
        if (idx >= 0) applyCategoryIndex(idx);
        else
          bus.emit('toast', {
            message: t('toast.categoryNotFound', { name: p.name }),
            kind: 'warning',
          });
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
          message: t(ok ? 'toast.theme' : 'toast.themeInvalid', { name: p.name }),
          kind: ok ? 'info' : 'warning',
        });
        done();
        break;
      }
      case 'font': {
        if (Number.isFinite(p.size) && p.size >= 8 && p.size <= 40) {
          settingsStore.set({ fontScale: Number((p.size / 15).toFixed(3)) });
          bus.emit('toast', { message: t('toast.font', { size: p.size }), kind: 'info' });
        } else {
          bus.emit('toast', { message: t('toast.fontInvalid'), kind: 'warning' });
        }
        done();
        break;
      }
      case 'margin': {
        if (!p.side) {
          bus.emit('toast', {
            message: t('toast.marginSideInvalid'),
            kind: 'warning',
          });
        } else if (!Number.isFinite(p.px) || p.px < 0 || p.px > 600) {
          bus.emit('toast', { message: t('toast.marginInvalid'), kind: 'warning' });
        } else {
          settingsStore.set(
            p.side === 'left'
              ? { safeLeft: p.px }
              : p.side === 'right'
                ? { safeRight: p.px }
                : { safeBottom: p.px },
          );
          const side = t(`margin.${p.side}`);
          bus.emit('toast', { message: t('toast.margin', { side, px: p.px }), kind: 'info' });
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
      case 'lang': {
        const list = ['auto', ...LANGUAGES.map((l) => l.code)].join(' · ');
        if (!p.name) {
          bus.emit('toast', { message: list, kind: 'info', timeout: 4000 });
        } else {
          const wanted = p.name.trim();
          const match =
            wanted.toLowerCase() === 'auto'
              ? 'auto'
              : LANGUAGES.find((l) => l.code.toLowerCase() === wanted.toLowerCase())?.code;
          if (match && settingsStore.setLanguage(match)) {
            const name = languageName(resolveLocale(match));
            bus.emit('toast', {
              message: t('toast.language', { name: match === 'auto' ? `auto (${name})` : name }),
              kind: 'info',
            });
          } else {
            bus.emit('toast', {
              message: t('toast.languageInvalid', { name: wanted, list }),
              kind: 'warning',
              timeout: 4000,
            });
          }
        }
        done();
        break;
      }
      case 'support':
        appStore.setState({ commandLine: '' });
        modes.toNormal();
        this.showSupport();
        break;
      case 'contribute':
        appStore.setState({ commandLine: '' });
        modes.toNormal();
        this.showContribute();
        break;
      case 'unknown':
        bus.emit('toast', {
          message: t('toast.unknownCommand', { input: p.input }),
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
    showInfo(t('info.favorites'), lines);
  }

  private showHistory(): void {
    const lines = historyStore
      .recentActivity(40)
      .map((a) => `${timeLabel(a.at)}  ${a.kind} ${a.label}`);
    showInfo(t('info.history'), lines);
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
    showInfo(t('info.notes'), lines);
  }

  private showAbout(): void {
    showInfo(t('info.about'), [
      t('about.tagline'),
      '',
      t('about.offline'),
      t('about.storage'),
      '',
      t('about.stats', {
        commands: content.totalEntries,
        technologies: content.totalTechnologies,
      }),
      t('about.builtWith'),
      '',
      { text: t('about.supportHint'), cls: 'info-support', onClick: () => this.showSupport() },
      {
        text: `+ ${t('help.contribute')}`,
        cls: 'info-support',
        onClick: () => this.showContribute(),
      },
    ]);
  }

  /** Linha clicável que copia `value` (links não abrem dentro do Wallpaper Engine). */
  private copyLine(label: string, value: string): InfoLine {
    return {
      text: `  › ${label.padEnd(10)} ${value}`,
      cls: 'info-support-link',
      title: value,
      onClick: () => {
        void copyToClipboard(value).then((ok) => {
          bus.emit('toast', {
            message: ok ? t('support.copied', { url: value }) : t('toast.copyFailed'),
            kind: ok ? 'success' : 'danger',
          });
        });
      },
    };
  }

  /** `:contribute` — como qualquer pessoa adiciona comandos/sheets. */
  private showContribute(): void {
    showInfo(t('info.contribute'), [
      t('contribute.intro'),
      '',
      t('contribute.how'),
      '',
      t('contribute.links'),
      this.copyLine(t('contribute.editor'), EDITOR_URL),
      this.copyLine(t('contribute.repo'), REPO_URL),
    ]);
  }

  /** `:support` — mensagem do autor + links de apoio (clique copia). */
  private showSupport(): void {
    const links = activeSupportLinks();
    const lines: InfoLine[] = [
      t('support.intro'),
      '',
      t('support.currency'),
      '',
      { text: t('support.thanks'), cls: 'info-support' },
      '',
      t('support.links'),
    ];
    if (!links.length) {
      lines.push({ text: t('support.noLinks'), cls: 'info-empty' });
    }
    for (const l of links) {
      lines.push({
        text: `  ♥ ${l.label.padEnd(16)} ${l.value}`,
        cls: 'info-support-link',
        title: l.value,
        onClick: () => {
          void copyToClipboard(l.value).then((ok) => {
            bus.emit('toast', {
              message: ok ? t('support.copied', { url: l.value }) : t('toast.copyFailed'),
              kind: ok ? 'success' : 'danger',
            });
          });
        },
      });
    }
    showInfo(t('info.support'), lines);
  }
}
