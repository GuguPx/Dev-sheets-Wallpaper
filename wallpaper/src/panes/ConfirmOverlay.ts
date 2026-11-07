import { h } from '@/core/dom';
import { t } from '@/i18n';

/**
 * Confirmação de comando destrutivo (seção 14). Bloqueia o teclado global
 * enquanto aberto (captura), exigindo um segundo "Y" para confirmar a CÓPIA.
 * Reforço: isto confirma apenas copiar para a área de transferência — o
 * comando NUNCA é executado (seção 27).
 */
export function confirmDanger(command: string, warnings: string[]): Promise<boolean> {
  const root = document.getElementById('overlay-root');
  if (!root) return Promise.resolve(false);

  return new Promise<boolean>((resolve) => {
    const box = h(
      'div',
      { class: 'confirm-box', role: 'alertdialog' },
      h('div', { class: 'confirm-head', text: t('confirm.title') }),
      h('pre', { class: 'confirm-cmd', text: command }),
      warnings.length
        ? h(
            'div',
            { class: 'confirm-warn' },
            ...warnings.map((w) => h('div', { class: 'confirm-warn-line', text: `! ${w}` })),
          )
        : h('div', {
            class: 'confirm-warn',
            text: t('confirm.generic'),
          }),
      h('div', {
        class: 'confirm-hint',
        text: t('confirm.hint'),
      }),
    );
    const overlay = h('div', { class: 'overlay confirm-overlay' }, box);
    root.appendChild(overlay);

    const finish = (result: boolean) => {
      document.removeEventListener('keydown', onKey, true);
      overlay.removeEventListener('pointerdown', onClick);
      overlay.remove();
      resolve(result);
    };

    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const k = e.key.toLowerCase();
      if (k === 'y') finish(true);
      else if (k === 'escape' || k === 'n') finish(false);
    };
    const onClick = (e: Event) => {
      if (e.target === overlay) finish(false);
    };

    // captura garante prioridade sobre o KeyboardManager global
    document.addEventListener('keydown', onKey, true);
    overlay.addEventListener('pointerdown', onClick);
  });
}
