import { h } from '@/core/dom';
import { bus } from '@/core/EventBus';

type Kind = 'info' | 'success' | 'warning' | 'danger';

/**
 * Toasts de terminal (feedback de cópia, favoritos etc. — seções 12/14).
 * Discretos, aparecem sobre a statusline e somem sozinhos.
 */
export function initToasts(): void {
  const root = document.getElementById('toast-root');
  if (!root) return;

  bus.on('toast', ({ message, kind = 'info', timeout = 2200 }) => {
    const el = h('div', { class: ['toast', `toast-${kind as Kind}`], text: message });
    root.appendChild(el);
    // força reflow para animar a entrada
    requestAnimationFrame(() => el.classList.add('toast-in'));
    window.setTimeout(() => {
      el.classList.remove('toast-in');
      window.setTimeout(() => el.remove(), 220);
    }, timeout);
  });
}
