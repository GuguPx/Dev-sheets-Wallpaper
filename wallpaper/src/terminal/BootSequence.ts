import { h, clear } from '@/core/dom';
import { t } from '@/i18n';

export interface BootOptions {
  enabled: boolean;
  commands: number;
  technologies: number;
  username: string;
  reducedMotion: boolean;
}

/**
 * Sequência de inicialização (seção 22). Curta (≤ 4s) e ignorável: qualquer
 * tecla ou clique pula. Retorna uma Promise resolvida ao final/skip.
 */
export function runBoot(host: HTMLElement, opts: BootOptions): Promise<void> {
  if (!opts.enabled || opts.reducedMotion) {
    host.remove();
    return Promise.resolve();
  }

  const lines = [
    { text: 'DEVSHEET Knowledge System v1.0', cls: 'boot-title' },
    { text: `[ OK ] ${t('boot.loadIndex')}`, cls: 'boot-ok' },
    { text: `[ OK ] ${t('boot.loadFavorites')}`, cls: 'boot-ok' },
    { text: `[ OK ] ${t('boot.buildCache')}`, cls: 'boot-ok' },
    { text: `[ OK ] ${t('boot.restoreSession')}`, cls: 'boot-ok' },
    {
      text: t('boot.stats', { commands: opts.commands, technologies: opts.technologies }),
      cls: 'boot-stat',
    },
    { text: `${opts.username}@devsheet:~$ `, cls: 'boot-prompt' },
  ];

  clear(host);
  host.classList.add('boot');
  const screen = h('div', { class: 'boot-screen' });
  host.appendChild(screen);

  return new Promise<void>((resolve) => {
    let done = false;
    const step = 380; // ms por linha (~2.7s no total)

    const finish = () => {
      if (done) return;
      done = true;
      cleanup();
      host.classList.add('boot-out');
      window.setTimeout(() => {
        host.remove();
        resolve();
      }, 240);
    };

    const timers: number[] = [];
    lines.forEach((ln, i) => {
      const t = window.setTimeout(() => {
        const el = h('div', { class: ['boot-line', ln.cls], text: ln.text });
        if (ln.cls === 'boot-prompt')
          el.appendChild(h('span', { class: 'boot-cursor', text: '_' }));
        screen.appendChild(el);
      }, i * step);
      timers.push(t);
    });
    timers.push(window.setTimeout(finish, lines.length * step + 500));

    const onSkip = () => finish();
    const cleanup = () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener('keydown', onSkip);
      window.removeEventListener('pointerdown', onSkip);
    };
    window.addEventListener('keydown', onSkip);
    window.addEventListener('pointerdown', onSkip);
  });
}
