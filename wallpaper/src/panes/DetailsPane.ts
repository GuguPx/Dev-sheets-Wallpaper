import { h, clear } from '@/core/dom';
import { t } from '@/i18n';
import { focusedFlat } from '@/terminal/actions';
import { RISK_DISPLAY } from '@/utils/risk';
import { renderCommandInto } from '@/utils/syntax';

/**
 * Painel de detalhes opcional (seção 4) — pré-visualização compacta do comando
 * em foco, ao lado da lista. Complementa o manual completo (aberto no Enter).
 */
export class DetailsPane {
  readonly el = h('div', { class: 'pane pane-details' });

  render(): void {
    clear(this.el);
    const flat = focusedFlat();

    this.el.appendChild(h('div', { class: 'pane-title' }, h('span', { text: t('pane.details') })));

    if (!flat) {
      this.el.appendChild(h('div', { class: 'empty', text: '—' }));
      return;
    }

    const e = flat.entry;
    const body = h('div', { class: 'details-body' });
    const dcmd = h('div', { class: 'details-cmd' });
    renderCommandInto(dcmd, e.command);
    body.appendChild(dcmd);
    body.appendChild(
      h('div', {
        class: ['details-risk', `tag-${RISK_DISPLAY[e.risk].tag}`],
        text: `[${RISK_DISPLAY[e.risk].tag}]`,
      }),
    );
    body.appendChild(h('div', { class: 'details-desc', text: e.description }));

    if (e.arguments.length) {
      body.appendChild(h('div', { class: 'details-h', text: t('manual.options') }));
      for (const a of e.arguments.slice(0, 6)) {
        body.appendChild(
          h(
            'div',
            { class: 'details-arg' },
            h('code', { text: a.flag }),
            h('span', { text: ` ${a.description}` }),
          ),
        );
      }
    }

    if (e.examples.length) {
      body.appendChild(h('div', { class: 'details-h', text: t('pane.example') }));
      const dex = h('pre', { class: 'details-ex' });
      renderCommandInto(dex, e.examples[0].code);
      body.appendChild(dex);
    }

    if (e.warnings.length) {
      body.appendChild(h('div', { class: 'details-h details-h-warn', text: t('manual.warnings') }));
      for (const w of e.warnings)
        body.appendChild(h('div', { class: 'details-warn', text: `! ${w}` }));
    }

    this.el.appendChild(body);
  }
}
