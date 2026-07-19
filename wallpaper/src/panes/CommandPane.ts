import { h, clear } from '@/core/dom';
import { appStore } from '@/stores/AppStore';
import { settingsStore } from '@/stores/SettingsStore';
import { favoritesStore } from '@/stores/FavoritesStore';
import { notesStore } from '@/stores/NotesStore';
import { content, ContentService } from '@/services/ContentService';
import {
  activeTechnology,
  currentEntries,
  copyEntry,
  toggleFavorite,
  openManual,
  displayCategories,
  applyCategoryIndex,
  recommendedFlat,
  selectTechnology,
} from '@/terminal/actions';
import { RISK_DISPLAY } from '@/utils/risk';
import { pad2, titleCase } from '@/utils/format';
import { techIcon } from '@/utils/icons';
import { renderCommandInto } from '@/utils/syntax';
import type { CheatEntry, FlatEntry, Technology } from '@/types';

/**
 * Painel principal de comandos (seção 8). Duas apresentações:
 *  - visão geral ("todos"): **grade de cards (bento)**, um quadrado por categoria
 *    com seus comandos realçados — inspirada em cheat sheets modernos;
 *  - categoria específica: lista de linhas (drill-in) para leitura densa.
 * Seleção (`commandIndex`) e navegação por teclado valem nas duas; tudo também é
 * clicável (copiar/favoritar/abrir manual) para funcionar sem teclado.
 */
export class CommandPane {
  readonly el = h('div', { class: 'pane pane-commands' });

  render(): void {
    clear(this.el);
    const st = appStore.getState();
    const s = settingsStore.getState();
    const focused = st.focus === 'commands';

    // Visão inicial "Recomendados / mais usados": cards por tecnologia.
    if (st.recommendedView) {
      const flat = recommendedFlat();
      this.el.appendChild(
        h(
          'div',
          { class: 'pane-title' },
          h(
            'div',
            { class: 'pane-title-main' },
            h('span', { class: 'pane-ic pane-ic-rec', text: '★' }),
            h('span', { text: 'RECOMENDADOS · essenciais' }),
          ),
          h('span', {
            class: 'pane-title-side',
            text: flat.length ? `${pad2(st.commandIndex + 1)}/${pad2(flat.length)}` : '0/0',
          }),
        ),
      );
      if (!flat.length) {
        this.el.appendChild(h('div', { class: 'empty', text: 'Sem comandos recomendados.' }));
        return;
      }
      this.renderRecommendedGrid(flat, st.commandIndex, focused, s.showFavorites);
      return;
    }

    const tech = activeTechnology();
    const entries = currentEntries();

    const gridView = st.activeCategory === null && !!tech;
    const catLabel = st.activeCategory ? titleCase(st.activeCategory) : 'todos';
    this.el.appendChild(
      h(
        'div',
        { class: 'pane-title' },
        h(
          'div',
          { class: 'pane-title-main' },
          tech ? techIcon(tech.id, 'pane-ic', tech.color) : false,
          h('span', { text: `${tech ? tech.shortName.toUpperCase() : ''} · ${catLabel}` }),
        ),
        h('span', {
          class: 'pane-title-side',
          text: entries.length ? `${pad2(st.commandIndex + 1)}/${pad2(entries.length)}` : '0/0',
        }),
      ),
    );

    if (!entries.length) {
      this.el.appendChild(h('div', { class: 'empty', text: 'Nenhum comando nesta categoria.' }));
      return;
    }

    if (gridView && tech) {
      this.renderGrid(tech, entries, st.commandIndex, focused, s.showFavorites);
      return;
    }

    const list = h('div', { class: 'cmd-list', attrs: { role: 'listbox' } });
    let selectedRow: HTMLElement | null = null;

    entries.forEach((entry, i) => {
      const selected = i === st.commandIndex;
      const row = this.renderRow(entry, i, selected, focused, s.showFavorites, tech?.id ?? '');
      if (selected) selectedRow = row;
      list.appendChild(row);
    });

    this.el.appendChild(list);
    // mantém o item selecionado visível (virtualização leve via content-visibility no CSS)
    if (selectedRow) (selectedRow as HTMLElement).scrollIntoView({ block: 'nearest' });
  }

  // -------------------------- grade recomendados --------------------------

  private renderRecommendedGrid(
    flat: FlatEntry[],
    commandIndex: number,
    paneFocused: boolean,
    showFav: boolean,
  ): void {
    // agrupa por tecnologia preservando a ordem, guardando o índice plano.
    const groups = new Map<
      string,
      { name: string; color: string; items: { entry: CheatEntry; idx: number }[] }
    >();
    flat.forEach((f, idx) => {
      let g = groups.get(f.technologyId);
      if (!g) {
        g = { name: f.technologyShortName, color: f.technologyColor, items: [] };
        groups.set(f.technologyId, g);
      }
      g.items.push({ entry: f.entry, idx });
    });

    const grid = h('div', { class: 'cmd-grid' });
    let selectedEl: HTMLElement | null = null;

    for (const [techId, g] of groups) {
      const card = h('div', { class: 'cat-card' });
      const head = h('button', {
        class: 'cat-card-head',
        attrs: { type: 'button', title: `Abrir ${g.name}` },
        on: { click: () => selectTechnology(techId) },
      });
      head.appendChild(techIcon(techId, 'pane-ic', g.color));
      head.appendChild(h('span', { class: 'cat-card-title', text: g.name.toUpperCase() }));
      head.appendChild(h('span', { class: 'cat-card-count', text: String(g.items.length) }));
      card.appendChild(head);

      const body = h('div', { class: 'cat-card-body' });
      g.items.forEach(({ entry, idx }) => {
        const selected = idx === commandIndex;
        const item = this.renderGridItem(entry, idx, selected, paneFocused, showFav, techId);
        if (selected) selectedEl = item;
        body.appendChild(item);
      });
      card.appendChild(body);
      grid.appendChild(card);
    }

    this.el.appendChild(grid);
    if (selectedEl) (selectedEl as HTMLElement).scrollIntoView({ block: 'nearest' });
  }

  // ------------------------------- grade (bento) ---------------------------

  private renderGrid(
    tech: Technology,
    allEntries: CheatEntry[],
    commandIndex: number,
    paneFocused: boolean,
    showFav: boolean,
  ): void {
    // índice plano por id → posição na lista "todos" (para seleção/teclado).
    const flatIndex = new Map<string, number>();
    allEntries.forEach((e, i) => flatIndex.set(e.id, i));

    const cats = displayCategories(tech).filter((c) => c !== '__all__');
    const grid = h('div', { class: 'cmd-grid' });
    let selectedEl: HTMLElement | null = null;

    cats.forEach((cat) => {
      const catEntries = content.entriesFor(tech.id, cat);
      if (!catEntries.length) return;

      const card = h('div', { class: 'cat-card' });
      const head = h('button', {
        class: 'cat-card-head',
        attrs: { type: 'button', title: `Abrir ${titleCase(cat)}` },
        on: {
          click: () => {
            const idx = displayCategories(tech).indexOf(cat);
            if (idx >= 0) applyCategoryIndex(idx);
          },
        },
      });
      head.appendChild(h('span', { class: 'cat-card-title', text: titleCase(cat) }));
      head.appendChild(h('span', { class: 'cat-card-count', text: String(catEntries.length) }));
      card.appendChild(head);

      const body = h('div', { class: 'cat-card-body' });
      catEntries.forEach((entry) => {
        const fi = flatIndex.get(entry.id) ?? -1;
        const selected = fi >= 0 && fi === commandIndex;
        const item = this.renderGridItem(entry, fi, selected, paneFocused, showFav, tech.id);
        if (selected) selectedEl = item;
        body.appendChild(item);
      });
      card.appendChild(body);
      grid.appendChild(card);
    });

    this.el.appendChild(grid);
    if (selectedEl) (selectedEl as HTMLElement).scrollIntoView({ block: 'nearest' });
  }

  private renderGridItem(
    entry: CheatEntry,
    flatIdx: number,
    selected: boolean,
    paneFocused: boolean,
    showFav: boolean,
    techId: string,
  ): HTMLElement {
    const risk = RISK_DISPLAY[entry.risk];
    const fav = favoritesStore.has(techId, entry.id);
    const hasNote = notesStore.hasNote(techId, entry.id);
    const flat = content.getEntry(techId, entry.id) ?? null;

    const item = h('div', {
      class: [
        'cc-item',
        `risk-${risk.tag}`,
        selected && 'cc-selected',
        selected && paneFocused && 'is-focused',
      ],
      dataset: { key: ContentService.key(techId, entry.id) },
      on: {
        click: () => {
          if (flatIdx >= 0) appStore.setState({ commandIndex: flatIdx, focus: 'commands' });
        },
        dblclick: () => flat && openManual(flat),
      },
    });

    const top = h('div', { class: 'cc-top' });
    if (showFav && fav) top.appendChild(h('span', { class: 'cc-fav is-fav', text: '★' }));
    const cmdEl = h('span', { class: 'cc-cmd' });
    renderCommandInto(cmdEl, entry.command);
    top.appendChild(cmdEl);
    if (hasNote) top.appendChild(h('span', { class: 'cmd-note', text: '[N]' }));
    top.appendChild(h('span', { class: ['cc-tag', `tag-${risk.tag}`], text: risk.tag }));

    // ações por mouse (fallback sem teclado)
    const actions = h('div', { class: 'cc-actions' });
    actions.appendChild(this.actionBtn('man', 'abrir manual', () => flat && openManual(flat)));
    actions.appendChild(
      this.actionBtn('copy', 'copiar', () => {
        void copyEntry(flat);
      }),
    );
    actions.appendChild(this.actionBtn(fav ? '★' : 'fav', 'favoritar', () => toggleFavorite(flat)));
    top.appendChild(actions);

    item.appendChild(top);
    if (entry.description)
      item.appendChild(h('div', { class: 'cc-desc', text: entry.description }));
    return item;
  }

  // ------------------------------- lista (drill-in) ------------------------

  private renderRow(
    entry: CheatEntry,
    i: number,
    selected: boolean,
    paneFocused: boolean,
    showFav: boolean,
    techId: string,
  ): HTMLElement {
    const risk = RISK_DISPLAY[entry.risk];
    const fav = favoritesStore.has(techId, entry.id);
    const hasNote = notesStore.hasNote(techId, entry.id);
    const flat = content.getEntry(techId, entry.id) ?? null;

    const row = h('div', {
      class: [
        'cmd-row',
        `risk-${risk.tag}`,
        selected && 'cmd-selected',
        selected && paneFocused && 'is-focused',
      ],
      dataset: { key: ContentService.key(techId, entry.id) },
      on: {
        click: () => {
          appStore.setState({ commandIndex: i, focus: 'commands' });
        },
        dblclick: () => flat && openManual(flat),
      },
    });

    const head = h('div', { class: 'cmd-head' });
    head.appendChild(h('span', { class: 'cmd-marker', text: selected ? '>' : ' ' }));
    head.appendChild(
      h('span', { class: ['cmd-fav', fav && 'is-fav'], text: showFav ? (fav ? '★' : '☆') : ' ' }),
    );
    head.appendChild(h('span', { class: 'cmd-num', text: pad2(i + 1) }));
    const cmdEl = h('span', { class: 'cmd-cmd' });
    renderCommandInto(cmdEl, entry.command);
    head.appendChild(cmdEl);
    if (hasNote) head.appendChild(h('span', { class: 'cmd-note', text: '[N]' }));
    head.appendChild(h('span', { class: 'cmd-spacer' }));
    head.appendChild(h('span', { class: ['cmd-tag', `tag-${risk.tag}`], text: `[${risk.tag}]` }));

    // ações por mouse (fallback sem teclado)
    const actions = h('div', { class: 'cmd-actions' });
    actions.appendChild(this.actionBtn('man', 'abrir manual', () => flat && openManual(flat)));
    actions.appendChild(
      this.actionBtn('copy', 'copiar', () => {
        void copyEntry(flat);
      }),
    );
    actions.appendChild(this.actionBtn(fav ? '★' : 'fav', 'favoritar', () => toggleFavorite(flat)));
    head.appendChild(actions);

    row.appendChild(head);
    row.appendChild(h('div', { class: 'cmd-desc', text: entry.description }));
    return row;
  }

  private actionBtn(label: string, title: string, onClick: () => void): HTMLElement {
    return h('button', {
      class: 'cmd-act',
      attrs: { type: 'button', title },
      text: label,
      on: {
        click: (e: Event) => {
          e.stopPropagation();
          onClick();
        },
      },
    });
  }
}
