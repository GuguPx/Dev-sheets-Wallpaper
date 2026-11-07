import './styles/terminal.css';
import './styles/themes.css';
import './styles/layout.css';
import './styles/crt.css';
import './styles/responsive.css';

import { bootstrap } from './app';
import { t } from './i18n';

bootstrap().catch((err) => {
  console.error('Falha ao iniciar devsheet:', err);
  const root = document.getElementById('devsheet');
  if (root) {
    const pre = document.createElement('pre');
    pre.className = 'fatal';
    pre.textContent = t('app.startError', { error: String(err) });
    root.appendChild(pre);
  }
});
