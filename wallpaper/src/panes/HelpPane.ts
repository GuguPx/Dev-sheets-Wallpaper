import { h, clear } from '@/core/dom';
import { modes } from '@/terminal/ModeManager';
import { t } from '@/i18n';

interface HelpGroup {
  title: string;
  items: [string, string][];
}

/** Montado a cada render: os textos seguem o idioma ativo. */
function groups(): HelpGroup[] {
  return [
    {
      title: t('help.navigation'),
      items: [
        ['j / ↓', t('help.nextItem')],
        ['k / ↑', t('help.prevItem')],
        ['h / ←', t('help.focusCategories')],
        ['l / →', t('help.focusCommands')],
        ['g g', t('help.firstItem')],
        ['G', t('help.lastItem')],
        ['Enter', t('help.openManual')],
        ['Esc', t('help.back')],
      ],
    },
    {
      title: t('help.tabs'),
      items: [
        ['1 … 9', t('help.selectTech')],
        ['Alt+1 … Alt+9', t('help.selectTech')],
        ['Ctrl+Tab', t('help.nextTech')],
        ['Ctrl+Shift+Tab', t('help.prevTech')],
      ],
    },
    {
      title: t('help.searchCommand'),
      items: [
        ['/', t('help.search')],
        ['Ctrl+K', t('help.palette')],
        [':', t('help.commandLine')],
        ['?', t('help.thisHelp')],
        [':lang', t('help.language')],
        [':support', t('help.support')],
        [':contribute', t('help.contribute')],
      ],
    },
    {
      title: t('help.actions'),
      items: [
        ['y', t('help.copy')],
        ['f', t('help.favorite')],
        ['n', t('help.note')],
        ['t', t('help.theme')],
      ],
    },
    {
      title: t('help.manual'),
      items: [
        ['j / k', t('help.scroll')],
        ['PageDown / PageUp', t('help.page')],
        ['g / G', t('help.startEnd')],
        ['q / Esc', t('help.close')],
      ],
    },
  ];
}

/** Ajuda interativa de atalhos (seção 18). Fecha com q/Esc/?. */
export class HelpPane {
  readonly el = h('div', { class: 'overlay overlay-help' });

  render(): void {
    clear(this.el);
    const box = h('div', { class: 'help-box' });
    box.appendChild(
      h(
        'div',
        { class: 'help-top' },
        h('span', { text: t('help.title') }),
        h('button', {
          class: 'manual-btn',
          attrs: { type: 'button' },
          text: `q ${t('common.close')}`,
          on: { click: () => modes.toNormal() },
        }),
      ),
    );

    const grid = h('div', { class: 'help-grid' });
    for (const g of groups()) {
      const col = h('div', { class: 'help-group' });
      col.appendChild(h('div', { class: 'help-h', text: g.title }));
      for (const [key, desc] of g.items) {
        col.appendChild(
          h(
            'div',
            { class: 'help-row' },
            h('span', { class: 'help-key', text: key }),
            h('span', { class: 'help-desc', text: desc }),
          ),
        );
      }
      grid.appendChild(col);
    }
    box.appendChild(grid);
    box.appendChild(
      h('div', {
        class: 'help-foot',
        text: t('help.footer'),
      }),
    );
    this.el.appendChild(box);
  }
}
