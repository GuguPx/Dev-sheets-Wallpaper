import { h, clear } from '@/core/dom';
import { appStore } from '@/stores/AppStore';
import {
  visibleTechnologies,
  selectTechnology,
  showRecommended,
  showIdle,
} from '@/terminal/actions';
import { techIcon } from '@/utils/icons';

/**
 * Barra superior de sessões estilo Tmux (seção 5). Cada tecnologia é uma
 * "janela" `[n:prompt]`; a ativa recebe `*` e destaque de cor. Clicável (mouse)
 * como alternativa ao teclado (importante no Wallpaper Engine — ver README).
 */
export class TechnologyTabs {
  readonly el = h('div', { class: 'tabs-bar' });

  render(): void {
    clear(this.el);
    const st = appStore.getState();
    const active = st.activeTechnologyId;

    this.el.appendChild(h('span', { class: 'tabs-brand', text: 'devsheet' }));
    const list = h('div', { class: 'tabs-list' });

    // Aba especial "Recomendados / mais usados" (visão inicial).
    const recActive = st.recommendedView && !st.idleView;
    const recTab = h('button', {
      class: ['tab', 'tab-rec', recActive && 'tab-active'],
      attrs: { type: 'button', title: 'Recomendados / mais usados por desenvolvedores' },
      style: { '--tab-accent': '#f5b041' },
      on: { click: () => showRecommended() },
    });
    recTab.appendChild(h('span', { class: 'tab-ic tab-rec-ic', text: '★' }));
    recTab.appendChild(h('span', { class: 'tab-name', text: 'rec' }));
    if (recActive) recTab.appendChild(h('span', { class: 'tab-mark', text: '*' }));
    list.appendChild(recTab);

    // Aba "tty": tela de descanso que esconde os sheets (tecla 0).
    const ttyTab = h('button', {
      class: ['tab', 'tab-tty', st.idleView && 'tab-active'],
      attrs: { type: 'button', title: 'Tela de descanso — esconde os cheat sheets (0)' },
      style: { '--tab-accent': '#7f8c8d' },
      on: { click: () => showIdle() },
    });
    ttyTab.appendChild(h('span', { class: 'tab-ic tab-tty-ic', text: '▮' }));
    ttyTab.appendChild(h('span', { class: 'tab-name', text: 'tty' }));
    if (st.idleView) ttyTab.appendChild(h('span', { class: 'tab-mark', text: '*' }));
    list.appendChild(ttyTab);

    visibleTechnologies().forEach((tech, i) => {
      const isActive = !st.recommendedView && !st.idleView && tech.id === active;
      const tab = h('button', {
        class: ['tab', isActive && 'tab-active'],
        attrs: { type: 'button', title: tech.name },
        style: { '--tab-accent': tech.color },
        on: { click: () => selectTechnology(tech.id) },
      });
      tab.appendChild(techIcon(tech.id, 'tab-ic'));
      tab.appendChild(h('span', { class: 'tab-index', text: String(i + 1) }));
      tab.appendChild(h('span', { class: 'tab-sep', text: ':' }));
      tab.appendChild(h('span', { class: 'tab-name', text: tech.prompt }));
      if (isActive) tab.appendChild(h('span', { class: 'tab-mark', text: '*' }));
      list.appendChild(tab);
    });

    this.el.appendChild(list);
  }
}
