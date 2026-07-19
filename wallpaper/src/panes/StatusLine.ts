import { h, clear } from '@/core/dom';
import { appStore } from '@/stores/AppStore';
import { settingsStore } from '@/stores/SettingsStore';
import { activeTechnology, currentEntries } from '@/terminal/actions';
import { search } from '@/services/SearchService';
import { clockLabel, titleCase } from '@/utils/format';

/**
 * Barra inferior estilo statusline do Neovim (seção 16). O conteúdo muda
 * conforme o modo ativo (seção 17).
 */
export class StatusLine {
  readonly el = h('div', { class: 'statusline', role: 'status' });

  render(): void {
    clear(this.el);
    const st = appStore.getState();
    const s = settingsStore.getState();

    const modeSeg = h('span', {
      class: ['status-mode', `mode-${st.mode}`],
      text: st.mode.toUpperCase(),
    });
    this.el.appendChild(modeSeg);

    const segs: string[] = [];
    switch (st.mode) {
      case 'search': {
        const n = st.searchQuery ? search.search(st.searchQuery).length : 0;
        segs.push(
          `query: ${st.searchQuery || '…'}`,
          `${n} results`,
          '↑↓ select',
          'Enter open',
          'Esc close',
        );
        break;
      }
      case 'manual': {
        const pct = Math.round(st.manualScroll * 100);
        const name = st.manualKey ? st.manualKey.split(':').slice(1).join(':') : '';
        segs.push(name, `${pct}%`, 'j/k scroll', 'y copy', 'f fav', 'n note', 'q close');
        break;
      }
      case 'command':
        segs.push(': comando interno', 'Enter run', 'Esc cancel');
        break;
      case 'notes':
        segs.push('editando nota', 'Ctrl+Enter salvar', 'Esc cancelar');
        break;
      case 'help':
        segs.push('atalhos', 'q/Esc fechar');
        break;
      default: {
        if (st.idleView) {
          segs.push(
            '▮ tty',
            'tela de descanso',
            'sheets ocultos',
            st.idleAuto ? 'mexa o mouse para voltar' : 'clique numa aba para voltar',
          );
          break;
        }
        const total = currentEntries().length;
        const pos = `${total ? st.commandIndex + 1 : 0}/${total}`;
        if (st.recommendedView) {
          segs.push('★ recomendados', 'essenciais', pos);
        } else {
          const tech = activeTechnology();
          segs.push(
            tech ? tech.prompt : '—',
            st.activeCategory ? titleCase(st.activeCategory) : 'todos',
            pos,
          );
        }
        segs.push('UTF-8', s.language.toUpperCase(), '/ search', ': cmd', '? help');
      }
    }

    for (const seg of segs) {
      this.el.appendChild(h('span', { class: 'status-sep', text: '│' }));
      this.el.appendChild(h('span', { class: 'status-seg', text: seg }));
    }

    if (s.showClock) {
      this.el.appendChild(h('span', { class: 'status-spacer' }));
      this.el.appendChild(
        h('span', { class: 'status-clock', text: clockLabel(new Date(), s.clock24h) }),
      );
    }
  }
}
