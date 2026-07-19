import { h, clear } from '@/core/dom';
import { appStore } from '@/stores/AppStore';
import {
  activeTechnology,
  displayCategories,
  applyCategoryIndex,
  ALL_CATEGORY,
} from '@/terminal/actions';
import { content } from '@/services/ContentService';
import { titleCase } from '@/utils/format';

/**
 * Menu lateral de categorias (seção 7) — moderno e discreto: fica recolhido num
 * rail estreito (chevron + categoria ativa na vertical) e expande como overlay
 * ao passar o mouse ou quando recebe foco de teclado, sem empurrar o layout.
 * Continua clicável como alternativa ao teclado.
 */
export class CategoryPane {
  readonly el = h('div', { class: 'pane pane-categories' });

  render(): void {
    clear(this.el);
    const st = appStore.getState();
    const tech = activeTechnology();
    const cats = displayCategories(tech);
    const focused = st.focus === 'categories';

    // Aberto quando o teclado está no menu (hover é tratado por CSS).
    this.el.classList.toggle('is-open', focused);

    const activeCat = cats[st.categoryIndex];
    const activeLabel =
      activeCat === ALL_CATEGORY ? 'todos' : activeCat ? titleCase(activeCat) : '';

    // Rail recolhido — afordância de que há um menu ali.
    const rail = h('div', { class: 'cat-rail', attrs: { 'aria-hidden': 'true' } });
    rail.appendChild(h('span', { class: 'cat-rail-glyph', text: '›' }));
    if (activeLabel) rail.appendChild(h('span', { class: 'cat-rail-label', text: activeLabel }));
    this.el.appendChild(rail);

    // Painel completo — expande no hover/foco.
    const panel = h('div', { class: 'cat-panel' });
    panel.appendChild(
      h(
        'div',
        { class: 'pane-title' },
        h('span', { text: 'CATEGORIES' }),
        h('span', { class: 'pane-title-side', text: tech ? tech.shortName : '' }),
      ),
    );

    const list = h('div', { class: 'cat-list' });
    cats.forEach((cat, i) => {
      const selected = i === st.categoryIndex;
      const label = cat === ALL_CATEGORY ? '· todos' : titleCase(cat);
      const count =
        cat === ALL_CATEGORY
          ? (tech?.entries.length ?? 0)
          : content.entriesFor(st.activeTechnologyId, cat).length;
      const row = h('button', {
        class: ['cat-row', selected && 'cat-selected', selected && focused && 'is-focused'],
        attrs: { type: 'button' },
        on: { click: () => applyCategoryIndex(i) },
      });
      row.appendChild(h('span', { class: 'cat-marker', text: selected ? '>' : ' ' }));
      row.appendChild(h('span', { class: 'cat-name', text: label }));
      row.appendChild(h('span', { class: 'cat-count', text: String(count) }));
      list.appendChild(row);
    });
    panel.appendChild(list);
    this.el.appendChild(panel);
  }
}
