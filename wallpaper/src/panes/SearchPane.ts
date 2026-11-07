import { h, clear, highlight } from '@/core/dom';
import { t } from '@/i18n';
import { appStore } from '@/stores/AppStore';
import { settingsStore } from '@/stores/SettingsStore';
import { historyStore } from '@/stores/HistoryStore';
import { content } from '@/services/ContentService';
import { search, type SearchResult } from '@/services/SearchService';
import { selectTechnology, openManual } from '@/terminal/actions';
import { modes } from '@/terminal/ModeManager';
import { bus } from '@/core/EventBus';
import { RISK_DISPLAY } from '@/utils/risk';

/**
 * Busca estilo FZF (seção 11). Overlay com input + resultados pontuados,
 * offline, sem acento e case-insensitive. Enter abre o comando; setas navegam.
 */
export class SearchPane {
  readonly el = h('div', { class: 'overlay overlay-search' });
  private input: HTMLInputElement | null = null;
  private listEl: HTMLElement | null = null;
  private results: SearchResult[] = [];
  private index = 0;

  focusInput(): void {
    this.input?.focus();
    this.input?.select();
  }

  render(): void {
    clear(this.el);
    this.index = appStore.getState().searchIndex;

    const box = h('div', { class: 'search-box' });
    const top = h('div', { class: 'search-top' });
    top.appendChild(h('span', { class: 'search-prompt', text: '>' }));

    const input = h('input', {
      class: 'search-input',
      attrs: {
        type: 'text',
        spellcheck: false,
        autocomplete: 'off',
        placeholder: t('search.placeholder'),
        'aria-label': t('search.aria'),
      },
    }) as HTMLInputElement;
    input.value = appStore.getState().searchQuery;
    input.addEventListener('input', () => {
      appStore.setState({ searchQuery: input.value, searchIndex: 0 });
      this.index = 0;
      this.update();
    });
    input.addEventListener('keydown', (e) => this.onKey(e));
    top.appendChild(input);
    top.appendChild(h('span', { class: 'search-count' }));
    box.appendChild(top);

    const list = h('div', { class: 'search-list', attrs: { role: 'listbox' } });
    box.appendChild(list);

    this.el.appendChild(box);
    this.el.addEventListener('pointerdown', (e) => {
      if (e.target === this.el) modes.toNormal();
    });

    this.input = input;
    this.listEl = list;
    this.update();
  }

  private onKey(e: KeyboardEvent): void {
    const k = e.key;
    if (k === 'ArrowDown' || (e.ctrlKey && k.toLowerCase() === 'j')) {
      e.preventDefault();
      this.move(1);
    } else if (k === 'ArrowUp' || (e.ctrlKey && k.toLowerCase() === 'k')) {
      e.preventDefault();
      this.move(-1);
    } else if (k === 'Enter') {
      e.preventDefault();
      this.select();
    } else if (k === 'Escape') {
      e.preventDefault();
      modes.toNormal();
    }
    e.stopPropagation();
  }

  private move(dir: number): void {
    if (!this.results.length) return;
    this.index = (this.index + dir + this.results.length) % this.results.length;
    appStore.setState({ searchIndex: this.index });
    this.update(true);
  }

  private update(keepQuery = false): void {
    if (!this.listEl) return;
    const query = appStore.getState().searchQuery;
    if (!keepQuery) this.results = search.search(query, 80);
    if (this.index >= this.results.length) this.index = Math.max(0, this.results.length - 1);

    const countEl = this.el.querySelector('.search-count');
    if (countEl)
      countEl.textContent = query ? t('search.results', { count: this.results.length }) : '';

    clear(this.listEl);
    if (!query) {
      this.listEl.appendChild(h('div', { class: 'search-empty', text: t('search.typeToSearch') }));
      return;
    }
    if (!this.results.length) {
      this.listEl.appendChild(h('div', { class: 'search-empty', text: t('search.noResults') }));
      return;
    }

    let selectedRow: HTMLElement | null = null;
    this.results.forEach((r, i) => {
      const selected = i === this.index;
      const e = r.item.entry;
      const tag = RISK_DISPLAY[e.risk].tag;
      const row = h('button', {
        class: ['search-row', selected && 'search-selected', `risk-${tag}`],
        attrs: { type: 'button' },
        on: {
          click: () => {
            this.index = i;
            this.select();
          },
        },
      });
      row.appendChild(h('span', { class: 'search-marker', text: selected ? '>' : ' ' }));
      row.appendChild(h('span', { class: 'search-tech', text: `[${r.item.technologyShortName}]` }));
      const cmd = h('span', { class: 'search-cmd' });
      cmd.append(...highlight(e.command, query));
      row.appendChild(cmd);
      const desc = h('span', { class: 'search-desc' });
      desc.append(...highlight(e.description, query));
      row.appendChild(desc);
      if (selected) selectedRow = row;
      this.listEl!.appendChild(row);
    });
    if (selectedRow) (selectedRow as HTMLElement).scrollIntoView({ block: 'nearest' });
  }

  private select(): void {
    const r = this.results[this.index];
    if (!r) return;
    const flat = r.item;
    const query = appStore.getState().searchQuery;

    bus.emit('entry:used', {
      technologyId: flat.technologyId,
      entryId: flat.entry.id,
      action: 'search-select',
    });
    if (settingsStore.getState().enableHistory && query) {
      historyStore.logActivity({ at: Date.now(), kind: 'search', label: `search ${query}` });
    }

    selectTechnology(flat.technologyId, false);
    const entries = content.entriesFor(flat.technologyId, null);
    const idx = entries.findIndex((x) => x.id === flat.entry.id);
    appStore.setState({ activeCategory: null, categoryIndex: 0, commandIndex: Math.max(0, idx) });
    openManual(flat);
  }
}
