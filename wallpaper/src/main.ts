import './styles/terminal.css';
import './styles/themes.css';
import './styles/layout.css';
import './styles/crt.css';
import './styles/responsive.css';

import { bootstrap } from './app';

bootstrap().catch((err) => {
  console.error('Falha ao iniciar devsheet:', err);
  const root = document.getElementById('devsheet');
  if (root) {
    const pre = document.createElement('pre');
    pre.className = 'fatal';
    pre.textContent = `Erro ao iniciar: ${String(err)}`;
    root.appendChild(pre);
  }
});
