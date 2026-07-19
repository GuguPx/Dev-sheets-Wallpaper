import { h } from '@/core/dom';

/**
 * Overlay informativo simples e efêmero para saídas de comandos internos
 * (`favorites`, `history`, `about` — seções 10/12/13). Fecha com q/Esc/clique.
 * Não é um modo Vim; sobrepõe o NORMAL sem alterar `state.mode`.
 */
export function showInfo(title: string, lines: string[]): void {
  const root = document.getElementById('overlay-root');
  if (!root) return;

  const body = h('div', { class: 'info-body' });
  if (lines.length === 0) {
    body.appendChild(h('div', { class: 'info-line info-empty', text: '— vazio —' }));
  } else {
    for (const l of lines) body.appendChild(h('div', { class: 'info-line', text: l }));
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
        text: 'q close',
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
