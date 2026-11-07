import { h } from '@/core/dom';
import { t } from '@/i18n';

/** Linha do overlay: texto simples ou item clicável/estilizado. */
export type InfoLine =
  string | { text: string; cls?: string; title?: string; onClick?: () => void };

/**
 * Overlay informativo simples e efêmero para saídas de comandos internos
 * (`favorites`, `history`, `about`, `support` — seções 10/12/13). Fecha com
 * q/Esc/clique. Não é um modo Vim; sobrepõe o NORMAL sem alterar `state.mode`.
 */
export function showInfo(title: string, lines: InfoLine[]): void {
  const root = document.getElementById('overlay-root');
  if (!root) return;

  const body = h('div', { class: 'info-body' });
  if (lines.length === 0) {
    body.appendChild(h('div', { class: 'info-line info-empty', text: t('common.empty') }));
  } else {
    for (const l of lines) {
      if (typeof l === 'string') {
        body.appendChild(h('div', { class: 'info-line', text: l }));
      } else if (l.onClick) {
        const fn = l.onClick;
        body.appendChild(
          h('button', {
            class: ['info-line', 'info-link', l.cls],
            attrs: { type: 'button', title: l.title ?? '' },
            text: l.text,
            on: { click: () => fn() },
          }),
        );
      } else {
        body.appendChild(h('div', { class: ['info-line', l.cls], text: l.text }));
      }
    }
  }

  const box = h(
    'div',
    { class: 'info-box' },
    h(
      'div',
      { class: 'info-top' },
      h('span', { text: title }),
      h('button', {
        class: 'manual-btn',
        attrs: { type: 'button' },
        text: `q ${t('common.close')}`,
        on: { click: () => finish() },
      }),
    ),
    body,
  );
  const overlay = h('div', { class: 'overlay info-overlay' }, box);
  root.appendChild(overlay);

  const onKey = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (k === 'escape' || k === 'q') {
      e.preventDefault();
      e.stopPropagation();
      finish();
    }
  };
  const onClick = (e: Event) => {
    if (e.target === overlay) finish();
  };
  function finish(): void {
    document.removeEventListener('keydown', onKey, true);
    overlay.removeEventListener('pointerdown', onClick);
    overlay.remove();
  }
  document.addEventListener('keydown', onKey, true);
  overlay.addEventListener('pointerdown', onClick);
}
