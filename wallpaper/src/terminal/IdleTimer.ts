import { appStore } from '@/stores/AppStore';
import { settingsStore } from '@/stores/SettingsStore';
import { bus } from '@/core/EventBus';
import { modes } from '@/terminal/ModeManager';
import type { AppState } from '@/types';

/**
 * Entra na aba "tty" (tela de descanso) sozinho depois de um tempo sem
 * interação, e volta ao que estava assim que o mouse/teclado se mexe.
 *
 * Só acorda o que ele mesmo colocou para dormir: se você escolheu a aba `tty`
 * na mão, ela fica até você clicar em outra (`idleAuto` distingue os dois).
 *
 * Usa timestamp + verificação periódica em vez de um `setTimeout` longo, para
 * sobreviver a pausas do Wallpaper Engine e ao throttling de aba oculta.
 */

const CHECK_MS = 5000;
const ACTIVITY = ['mousemove', 'mousedown', 'wheel', 'keydown', 'touchstart'] as const;

/** Campos restaurados ao acordar. */
type ViewSnapshot = Pick<
  AppState,
  | 'recommendedView'
  | 'activeTechnologyId'
  | 'activeCategory'
  | 'categoryIndex'
  | 'commandIndex'
  | 'focus'
>;

class IdleTimer {
  private last = Date.now();
  private timer = 0;
  private snapshot: ViewSnapshot | null = null;

  start(): void {
    for (const ev of ACTIVITY) {
      window.addEventListener(ev, () => this.onActivity(), { passive: true });
    }
    this.timer = window.setInterval(() => this.check(), CHECK_MS);
  }

  stop(): void {
    if (this.timer) window.clearInterval(this.timer);
    this.timer = 0;
  }

  private onActivity(): void {
    this.last = Date.now();
    const st = appStore.getState();
    if (st.idleView && st.idleAuto) this.wake();
  }

  private check(): void {
    const minutes = settingsStore.getState().idleTimeout;
    if (minutes <= 0) return;

    const st = appStore.getState();
    if (st.idleView) return;
    // Não interrompe quem está digitando: nota e linha de comando têm rascunho.
    if (st.mode === 'notes' || st.mode === 'command') return;
    if (Date.now() - this.last < minutes * 60_000) return;

    this.sleep();
  }

  private sleep(): void {
    const s = appStore.getState();
    this.snapshot = {
      recommendedView: s.recommendedView,
      activeTechnologyId: s.activeTechnologyId,
      activeCategory: s.activeCategory,
      categoryIndex: s.categoryIndex,
      commandIndex: s.commandIndex,
      focus: s.focus,
    };
    // Fecha busca/manual/ajuda: senão o overlay ficaria por cima da tela de
    // descanso, expondo justamente o que ela deveria esconder.
    if (s.mode !== 'normal') modes.back();
    appStore.setState({ idleView: true, idleAuto: true, recommendedView: false });
    bus.emit('render');
  }

  private wake(): void {
    const restore = this.snapshot ?? { recommendedView: true };
    this.snapshot = null;
    appStore.setState({ ...restore, idleView: false, idleAuto: false });
    bus.emit('render');
  }
}

export const idleTimer = new IdleTimer();
