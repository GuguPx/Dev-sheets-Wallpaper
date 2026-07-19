import { h, clear } from '@/core/dom';
import { modes } from '@/terminal/ModeManager';

interface HelpGroup {
  title: string;
  items: [string, string][];
}

const GROUPS: HelpGroup[] = [
  {
    title: 'NAVIGATION',
    items: [
      ['j / ↓', 'Próximo item'],
      ['k / ↑', 'Item anterior'],
      ['h / ←', 'Foco: categorias'],
      ['l / →', 'Foco: comandos'],
      ['g g', 'Primeiro item'],
      ['G', 'Último item'],
      ['Enter', 'Abrir manual do comando'],
      ['Esc', 'Voltar / modo NORMAL'],
    ],
  },
  {
    title: 'TABS (tecnologias)',
    items: [
      ['1 … 9', 'Selecionar tecnologia'],
      ['Alt+1 … Alt+9', 'Selecionar tecnologia'],
      ['Ctrl+Tab', 'Próxima tecnologia'],
      ['Ctrl+Shift+Tab', 'Tecnologia anterior'],
    ],
  },
  {
    title: 'SEARCH / COMMAND',
    items: [
      ['/', 'Buscar (FZF)'],
      ['Ctrl+K', 'Buscar (palette)'],
      [':', 'Linha de comando interna'],
      ['?', 'Esta ajuda'],
    ],
  },
  {
    title: 'ACTIONS',
    items: [
      ['y', 'Copiar comando'],
      ['f', 'Favoritar / desfavoritar'],
      ['n', 'Adicionar/editar nota'],
      ['t', 'Alternar tema'],
    ],
  },
  {
    title: 'MANUAL (man page)',
    items: [
      ['j / k', 'Rolar'],
      ['PageDown / PageUp', 'Página'],
      ['g / G', 'Início / fim'],
      ['q / Esc', 'Fechar'],
    ],
  },
];

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
        h('span', { text: 'KEYBINDINGS' }),
        h('button', {
          class: 'manual-btn',
          attrs: { type: 'button' },
          text: 'q close',
          on: { click: () => modes.toNormal() },
        }),
      ),
    );

    const grid = h('div', { class: 'help-grid' });
    for (const g of GROUPS) {
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
        text: 'devsheet — consulta offline. Nenhum comando é executado.',
      }),
    );
    this.el.appendChild(box);
  }
}
