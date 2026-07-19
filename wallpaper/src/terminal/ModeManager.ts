import { appStore } from '@/stores/AppStore';
import { bus } from '@/core/EventBus';
import type { EntryKey, Mode } from '@/types';

/**
 * Orquestra as transições entre modos estilo Vim (seção 17). É a única
 * autoridade sobre `state.mode`: ajusta os buffers relacionados e emite
 * `mode:change` para que a shell mostre/esconda overlays e atualize a statusline.
 */
export class ModeManager {
  get mode(): Mode {
    return appStore.getState().mode;
  }

  private enter(mode: Mode, patch: Partial<import('@/types').AppState> = {}): void {
    appStore.setState({ ...patch, mode });
    bus.emit('mode:change', { mode });
  }

  toNormal(): void {
    this.enter('normal', {
      manualKey: null,
      noteEntryKey: null,
      noteDraft: '',
      pendingKey: null,
    });
  }

  toSearch(): void {
    this.enter('search', { searchIndex: 0 });
    bus.emit('search:open');
  }

  toCommand(prefill = ''): void {
    this.enter('command', { commandLine: prefill });
  }

  toManual(key: EntryKey): void {
    this.enter('manual', { manualKey: key, manualScroll: 0 });
    bus.emit('manual:open', { key });
  }

  toNotes(key: EntryKey, draft: string): void {
    this.enter('notes', { noteEntryKey: key, noteDraft: draft });
  }

  toHelp(): void {
    this.enter('help');
  }

  toggleHelp(): void {
    if (this.mode === 'help') this.toNormal();
    else this.toHelp();
  }

  /** Esc universal: fecha overlay/modo atual e volta ao NORMAL. */
  back(): void {
    if (this.mode === 'manual') bus.emit('manual:close');
    if (this.mode === 'search') bus.emit('search:close');
    this.toNormal();
  }
}

export const modes = new ModeManager();
