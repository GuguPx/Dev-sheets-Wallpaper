import { Store } from '@/core/Store';
import type { AppState, Mode } from '@/types';
import { settingsStore } from './SettingsStore';
import { bus } from '@/core/EventBus';

class AppStoreImpl extends Store<AppState> {
  constructor() {
    const s = settingsStore.getState();
    super({
      mode: 'normal',
      focus: 'commands',
      activeTechnologyId: s.initialTechnology,
      recommendedView: true,
      idleView: false,
      idleAuto: false,
      activeCategory: null,
      commandIndex: 0,
      categoryIndex: 0,
      manualKey: null,
      manualScroll: 0,
      searchQuery: '',
      searchIndex: 0,
      commandLine: '',
      noteDraft: '',
      noteEntryKey: null,
      pendingKey: null,
      booted: false,
      visible: !document.hidden,
    });
  }

  /** Troca de modo, emitindo o evento correspondente. */
  setMode(mode: Mode): void {
    if (this.getState().mode === mode) return;
    this.setState({ mode });
    bus.emit('mode:change', { mode });
  }
}

export const appStore = new AppStoreImpl();
