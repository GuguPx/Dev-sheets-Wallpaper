import { Store } from '@/core/Store';
import type { Settings, ThemeName } from '@/types';
import { readLocal, writeLocal } from '@/services/StorageService';
import { bus } from '@/core/EventBus';

const THEMES: ThemeName[] = [
  'graphite',
  'ice',
  'mint',
  'amber',
  'violet',
  'vscode',
  'caderno',
  'classic-green',
];

export const DEFAULT_SETTINGS: Settings = {
  theme: 'graphite',
  language: 'pt-BR',
  username: 'augusto',
  initialTechnology: 'git',
  fontFamily: '',
  fontScale: 1,
  uiScale: 1,
  safeBottom: 48,
  safeLeft: 160,
  safeRight: 0,
  idleTimeout: 5,

  crtLevel: 'low',
  scanlines: true,
  flicker: false,
  noise: false,
  glow: true,
  vignette: true,
  chromatic: false,
  curvature: false,

  bootAnimation: true,

  showClock: true,
  clock24h: true,

  showTabs: true,
  showCategoryPane: true,
  showDetailsPane: false,
  showCommandLine: true,
  showStatusBar: true,

  enableHistory: true,
  showFavorites: true,

  lines: 0,
  density: 'normal',

  maxFps: 30,
  reducedMotion: false,
  keyboardShortcuts: true,
  syntaxHighlight: true,

  accentColor: '',

  favoriteTechnologies: [
    'git',
    'docker',
    'docker-compose',
    'linux',
    'bash',
    'ssh',
    'nginx',
    'pm2',
    'postgresql',
    'redis',
  ],
  hiddenTechnologies: [],
};

class SettingsStoreImpl extends Store<Settings> {
  constructor() {
    const saved = readLocal<Partial<Settings>>('settings', {});
    // 'victor' era o default antigo: quem nunca personalizou herda o novo.
    if (saved.username === 'victor') delete saved.username;
    super({ ...DEFAULT_SETTINGS, ...saved });
  }

  init(): void {
    // Detecta preferência de redução de movimento do sistema.
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (mq) {
      const apply = () => {
        if (mq.matches && !this.getState().reducedMotion) {
          this.set({ reducedMotion: true });
        }
      };
      apply();
      mq.addEventListener?.('change', apply);
    }
    this.apply();
    this.subscribe(() => {
      writeLocal('settings', this.getState());
      this.apply();
    });
  }

  set(patch: Partial<Settings>): void {
    const prevTheme = this.getState().theme;
    this.setState(patch);
    if (patch.theme && patch.theme !== prevTheme) {
      bus.emit('theme:changed', { theme: patch.theme });
    }
  }

  cycleTheme(dir = 1): void {
    const cur = this.getState().theme;
    const idx = THEMES.indexOf(cur);
    this.set({ theme: THEMES[(idx + dir + THEMES.length) % THEMES.length] });
  }

  setTheme(theme: string): boolean {
    if (!THEMES.includes(theme as ThemeName)) return false;
    this.set({ theme: theme as ThemeName });
    return true;
  }

  isTechnologyHidden(id: string): boolean {
    return this.getState().hiddenTechnologies.includes(id);
  }

  /** Aplica as configurações visuais ao documento (CSS variables + data-attrs). */
  apply(): void {
    const s = this.getState();
    const root = document.documentElement;
    root.dataset.theme = s.theme;
    root.style.setProperty('--ui-scale', String(s.uiScale));
    root.style.setProperty('--font-scale', String(s.fontScale));
    root.style.setProperty('--safe-bottom', `${Math.max(0, s.safeBottom)}px`);
    root.style.setProperty('--safe-left', `${Math.max(0, s.safeLeft)}px`);
    root.style.setProperty('--safe-right', `${Math.max(0, s.safeRight)}px`);
    root.style.setProperty('--max-fps', String(s.maxFps));
    root.dataset.density = s.density;
    root.dataset.syntax = String(s.syntaxHighlight);
    root.lang = s.language;

    if (s.fontFamily) root.style.setProperty('--font-user', s.fontFamily);
    else root.style.removeProperty('--font-user');

    if (s.accentColor) root.style.setProperty('--accent', s.accentColor);
    else root.style.removeProperty('--accent');

    const crtOff = s.crtLevel === 'off';
    root.dataset.crt = s.crtLevel;
    root.dataset.motion = s.reducedMotion ? 'reduced' : 'full';
    root.dataset.scanlines = String(s.scanlines && !crtOff);
    root.dataset.flicker = String(s.flicker && !crtOff && !s.reducedMotion);
    root.dataset.noise = String(s.noise && !crtOff);
    root.dataset.glow = String(s.glow && !crtOff);
    root.dataset.vignette = String(s.vignette && !crtOff);
    root.dataset.chromatic = String(s.chromatic && !crtOff);
    root.dataset.curvature = String(s.curvature && !crtOff);
  }
}

export const settingsStore = new SettingsStoreImpl();
