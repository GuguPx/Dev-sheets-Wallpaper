import { settingsStore, DEFAULT_SETTINGS } from '@/stores/SettingsStore';
import { appStore } from '@/stores/AppStore';
import type { Settings } from '@/types';

/**
 * Ponte com o Wallpaper Engine. Implementa `window.wallpaperPropertyListener`
 * e mapeia as propriedades do `project.json` para o SettingsStore (seção 26).
 *
 * A aplicação funciona normalmente FORA do Wallpaper Engine: se o objeto não
 * existir, nada acontece e os defaults valem.
 */

interface WEProp {
  value: string | number | boolean;
}
type WEProps = Record<string, WEProp | undefined>;

interface WallpaperPropertyListener {
  applyUserProperties?: (props: WEProps) => void;
  applyGeneralProperties?: (props: WEProps) => void;
  setPaused?: (paused: boolean) => void;
}

declare global {
  interface Window {
    wallpaperPropertyListener?: WallpaperPropertyListener;
    wallpaperRegisterAudioListener?: (cb: (data: number[]) => void) => void;
  }
}

/** Converte "r g b" (0..1) do WE para hex. */
function weColorToHex(value: string): string {
  const parts = value.split(' ').map((n) => parseFloat(n));
  if (parts.length < 3 || parts.some(Number.isNaN)) return '#8a9199';
  const [r, g, b] = parts.map((c) => Math.round(Math.max(0, Math.min(1, c)) * 255));
  return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');
}

const bool = (v: WEProp['value']) => Boolean(v);
const num = (v: WEProp['value']) => Number(v);
const str = (v: WEProp['value']) => String(v);

/** Mapa propriedade WE -> transformação para o SettingsStore. */
const MAP: Record<string, (v: WEProp['value']) => Partial<Settings>> = {
  schemecolor: (v) => ({ accentColor: weColorToHex(str(v)) }),
  theme: (v) => ({ theme: str(v) as Settings['theme'] }),
  language: (v) => ({ language: str(v) as Settings['language'] }),
  username: (v) => ({ username: str(v).trim() || DEFAULT_SETTINGS.username }),
  initialTechnology: (v) => ({ initialTechnology: str(v).toLowerCase().trim() }),
  fontFamily: (v) => ({ fontFamily: str(v).trim() }),
  fontScale: (v) => ({ fontScale: num(v) }),
  uiScale: (v) => ({ uiScale: num(v) }),
  safeBottom: (v) => ({ safeBottom: num(v) }),
  safeLeft: (v) => ({ safeLeft: num(v) }),
  safeRight: (v) => ({ safeRight: num(v) }),
  idleTimeout: (v) => ({ idleTimeout: num(v) }),
  crtLevel: (v) => ({ crtLevel: str(v) as Settings['crtLevel'] }),
  scanlines: (v) => ({ scanlines: bool(v) }),
  flicker: (v) => ({ flicker: bool(v) }),
  noise: (v) => ({ noise: bool(v) }),
  glow: (v) => ({ glow: bool(v) }),
  vignette: (v) => ({ vignette: bool(v) }),
  chromatic: (v) => ({ chromatic: bool(v) }),
  curvature: (v) => ({ curvature: bool(v) }),
  bootAnimation: (v) => ({ bootAnimation: bool(v) }),
  showClock: (v) => ({ showClock: bool(v) }),
  clock24h: (v) => ({ clock24h: bool(v) }),
  showTabs: (v) => ({ showTabs: bool(v) }),
  showCategoryPane: (v) => ({ showCategoryPane: bool(v) }),
  showDetailsPane: (v) => ({ showDetailsPane: bool(v) }),
  showCommandLine: (v) => ({ showCommandLine: bool(v) }),
  showStatusBar: (v) => ({ showStatusBar: bool(v) }),
  enableHistory: (v) => ({ enableHistory: bool(v) }),
  showFavorites: (v) => ({ showFavorites: bool(v) }),
  lines: (v) => ({ lines: num(v) }),
  density: (v) => ({ density: str(v) as Settings['density'] }),
  maxFps: (v) => ({ maxFps: num(v) }),
  reducedMotion: (v) => ({ reducedMotion: bool(v) }),
  keyboardShortcuts: (v) => ({ keyboardShortcuts: bool(v) }),
  syntaxHighlight: (v) => ({ syntaxHighlight: bool(v) }),
};

function applyProps(props: WEProps): void {
  const patch: Partial<Settings> = {};
  for (const [key, prop] of Object.entries(props)) {
    if (!prop || prop.value === undefined) continue;
    const fn = MAP[key];
    if (fn) Object.assign(patch, fn(prop.value));
  }
  if (Object.keys(patch).length > 0) {
    settingsStore.set(patch);
    if (patch.initialTechnology) {
      appStore.setState({ activeTechnologyId: patch.initialTechnology });
    }
  }
}

export function initWallpaperEngine(): void {
  const listener: WallpaperPropertyListener = {
    applyUserProperties: (props) => applyProps(props),
    applyGeneralProperties: (props) => applyProps(props),
    setPaused: (paused) => {
      appStore.setState({ visible: !paused });
    },
  };
  window.wallpaperPropertyListener = listener;
}

/** true quando rodando dentro do Wallpaper Engine. */
export function isInsideWallpaperEngine(): boolean {
  return typeof window.wallpaperRegisterAudioListener === 'function';
}
