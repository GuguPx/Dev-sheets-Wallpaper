import { describe, it, expect, beforeEach } from 'vitest';
import { modes } from '@/terminal/ModeManager';
import { appStore } from '@/stores/AppStore';

beforeEach(() => modes.toNormal());

describe('ModeManager (modos estilo Vim)', () => {
  it('entra e sai da busca', () => {
    modes.toSearch();
    expect(appStore.getState().mode).toBe('search');
    modes.toNormal();
    expect(appStore.getState().mode).toBe('normal');
  });

  it('abre o manual com a chave do comando', () => {
    modes.toManual('git:git-status');
    expect(appStore.getState().mode).toBe('manual');
    expect(appStore.getState().manualKey).toBe('git:git-status');
  });

  it('toNormal limpa buffers do manual/notas', () => {
    modes.toManual('git:git-status');
    modes.toNormal();
    expect(appStore.getState().manualKey).toBeNull();
    expect(appStore.getState().noteEntryKey).toBeNull();
  });

  it('toggleHelp alterna help/normal', () => {
    modes.toggleHelp();
    expect(appStore.getState().mode).toBe('help');
    modes.toggleHelp();
    expect(appStore.getState().mode).toBe('normal');
  });

  it('entra no modo comando com prefill', () => {
    modes.toCommand('open git');
    expect(appStore.getState().mode).toBe('command');
    expect(appStore.getState().commandLine).toBe('open git');
  });
});
