import { h, clear } from '@/core/dom';
import { appStore } from '@/stores/AppStore';
import { settingsStore } from '@/stores/SettingsStore';
import { activeTechnology, currentEntries } from '@/terminal/actions';
import { search } from '@/services/SearchService';
import { clockLabel } from '@/utils/format';
import { content } from '@/services/ContentService';
import { t, getLocale } from '@/i18n';

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
          t('status.query', { query: st.searchQuery || '…' }),
          t('search.results', { count: n }),
          `↑↓ ${t('status.select')}`,
          `Enter ${t('status.open')}`,
          `Esc ${t('status.close')}`,
        );
        break;
      }
      case 'manual': {
        const pct = Math.round(st.manualScroll * 100);
        const name = st.manualKey ? st.manualKey.split(':').slice(1).join(':') : '';
        segs.push(
          name,
          `${pct}%`,
          `j/k ${t('status.scroll')}`,
          `y ${t('status.copy')}`,
          `f ${t('status.fav')}`,
          `n ${t('status.note')}`,
          `q ${t('status.close')}`,
        );
        break;
      }
      case 'command':
        segs.push(
          `: ${t('status.internalCommand')}`,
          `Enter ${t('status.run')}`,
          `Esc ${t('status.cancel')}`,
        );
        break;
      case 'notes':
        segs.push(
          t('status.editingNote'),
          `Ctrl+Enter ${t('status.save')}`,
          `Esc ${t('status.cancelNote')}`,
        );
        break;
      case 'help':
        segs.push(t('status.shortcuts'), `q/Esc ${t('status.closeHelp')}`);
        break;
      default: {
        if (st.idleView) {
          segs.push(
            '▮ tty',
            t('status.idle'),
            t('status.sheetsHidden'),
            st.idleAuto ? t('status.idleWakeMouse') : t('status.idleWakeClick'),
          );
          break;
        }
        const total = currentEntries().length;
        const pos = `${total ? st.commandIndex + 1 : 0}/${total}`;
        if (st.recommendedView) {
          segs.push(`★ ${t('status.recommended')}`, t('status.essentials'), pos);
        } else {
          const tech = activeTechnology();
          segs.push(
            tech ? tech.prompt : '—',
            st.activeCategory
              ? content.categoryLabel(st.activeTechnologyId, st.activeCategory)
              : t('common.all'),
            pos,
          );
        }
        segs.push(
          'UTF-8',
          getLocale().toUpperCase(),
          `/ ${t('status.search')}`,
          `: ${t('status.cmd')}`,
          `? ${t('status.help')}`,
        );
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
