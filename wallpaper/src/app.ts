import { h } from '@/core/dom';
import { content } from '@/services/ContentService';
import { search } from '@/services/SearchService';
import { settingsStore } from '@/stores/SettingsStore';
import { appStore } from '@/stores/AppStore';
import { notesStore } from '@/stores/NotesStore';
import { initWallpaperEngine } from '@/services/WallpaperEngineService';
import { initLocalAnalytics } from '@/services/AnalyticsLocalService';
import { initToasts } from '@/panes/Toast';
import { runBoot } from '@/terminal/BootSequence';
import { keyboard } from '@/terminal/KeyboardManager';
import { idleTimer } from '@/terminal/IdleTimer';
import { TerminalShell } from '@/terminal/TerminalShell';
import { bus } from '@/core/EventBus';
import { t, getLocale, isLocale } from '@/i18n';

/**
 * Ponto de entrada da aplicação. Inicializa configurações, ponte com o Wallpaper
 * Engine, conteúdo (validado por Zod), índice de busca, analytics local e monta
 * a shell do terminal. Funciona igualmente no navegador e no Wallpaper Engine.
 */
export async function bootstrap(): Promise<void> {
  // 1. Configurações (aplica tema/escala/CRT imediatamente para evitar flash).
  settingsStore.init();

  // 2. Ponte Wallpaper Engine (no-op fora do WE).
  initWallpaperEngine();

  // 3. Conteúdo embutido, validado. Erros não passam em silêncio.
  const { errors } = content.load();
  if (errors.length) console.error('[content] erros de validação:', errors);
  // Conteúdo no idioma ativo; troca de idioma re-traduz e reindexa a busca.
  content.setLocale(getLocale());
  bus.on('locale:changed', ({ locale }) => {
    if (!isLocale(locale)) return;
    content.setLocale(locale);
    search.setIndex(content.getFlatEntries());
  });

  const techs = content.getTechnologies();
  if (techs.length && !content.getTechnology(appStore.getState().activeTechnologyId)) {
    appStore.setState({ activeTechnologyId: techs[0].id });
  }

  // 4. Índice de busca (offline).
  search.setIndex(content.getFlatEntries());

  // 5. Analytics local + anotações (IndexedDB, assíncrono).
  initLocalAnalytics();
  void notesStore.init();

  // 6. Toasts + shell.
  initToasts();
  const root = document.getElementById('devsheet');
  if (!root) throw new Error('#devsheet não encontrado');

  const shell = new TerminalShell();
  shell.mount(root);
  keyboard.attach(shell);
  idleTimer.start();

  // Pausa animações quando oculto (seção 28).
  document.addEventListener('visibilitychange', () => {
    const visible = !document.hidden;
    appStore.setState({ visible });
    document.documentElement.dataset.paused = String(!visible);
  });

  if (!techs.length) {
    root.appendChild(
      h('div', {
        class: 'fatal',
        text: t('app.noTechnologies'),
      }),
    );
    return;
  }

  // 7. Sequência de boot (seção 22), então libera o terminal.
  const s = settingsStore.getState();
  const bootHost = h('div', { class: 'boot-host' });
  document.body.appendChild(bootHost);
  await runBoot(bootHost, {
    enabled: s.bootAnimation,
    commands: content.totalEntries,
    technologies: content.totalTechnologies,
    username: s.username,
    reducedMotion: s.reducedMotion,
  });
  appStore.setState({ booted: true });
}
