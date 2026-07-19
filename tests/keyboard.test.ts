import { describe, it, expect } from 'vitest';
import { comboFromEvent, isTypingTarget } from '@/utils/keyboard';
import { resolveNormal } from '@/terminal/KeyboardManager';

const ev = (init: KeyboardEventInit) => new KeyboardEvent('keydown', init);

describe('comboFromEvent', () => {
  it('monta combos com modificadores', () => {
    expect(comboFromEvent(ev({ key: 'k', ctrlKey: true }))).toBe('ctrl+k');
    expect(comboFromEvent(ev({ key: 'Tab', ctrlKey: true, shiftKey: true }))).toBe(
      'ctrl+shift+tab',
    );
    expect(comboFromEvent(ev({ key: '1', altKey: true }))).toBe('alt+1');
    expect(comboFromEvent(ev({ key: 'j' }))).toBe('j');
  });
});

describe('resolveNormal (modo NORMAL, puro)', () => {
  const r = (init: KeyboardEventInit, pending: string | null = null) =>
    resolveNormal(ev(init), pending);

  it('navegação', () => {
    expect(r({ key: 'j' }).action).toEqual({ t: 'move', d: 1 });
    expect(r({ key: 'ArrowDown' }).action).toEqual({ t: 'move', d: 1 });
    expect(r({ key: 'k' }).action).toEqual({ t: 'move', d: -1 });
    expect(r({ key: 'h' }).action).toEqual({ t: 'focus', d: 'left' });
    expect(r({ key: 'l' }).action).toEqual({ t: 'focus', d: 'right' });
    expect(r({ key: 'G' }).action).toEqual({ t: 'last' });
  });

  it('sequência gg vai para o primeiro', () => {
    const first = r({ key: 'g' });
    expect(first.action).toBeNull();
    expect(first.pending).toBe('g');
    const second = resolveNormal(ev({ key: 'g' }), 'g');
    expect(second.action).toEqual({ t: 'first' });
  });

  it('tabs por número e Alt', () => {
    expect(r({ key: '3' }).action).toEqual({ t: 'tab', n: 3 });
    // 0 é a aba "tty" (tela de descanso), não uma tecnologia
    expect(r({ key: '0' }).action).toEqual({ t: 'idle' });
    expect(r({ key: '2', altKey: true }).action).toEqual({ t: 'tab', n: 2 });
    expect(r({ key: 'Tab', ctrlKey: true }).action).toEqual({ t: 'cycle', d: 1 });
    expect(r({ key: 'Tab', ctrlKey: true, shiftKey: true }).action).toEqual({ t: 'cycle', d: -1 });
  });

  it('modos e ações', () => {
    expect(r({ key: '/' }).action).toEqual({ t: 'search' });
    expect(r({ key: 'k', ctrlKey: true }).action).toEqual({ t: 'search' });
    expect(r({ key: ':' }).action).toEqual({ t: 'command' });
    expect(r({ key: '?' }).action).toEqual({ t: 'help' });
    expect(r({ key: 'y' }).action).toEqual({ t: 'copy' });
    expect(r({ key: 'f' }).action).toEqual({ t: 'fav' });
    expect(r({ key: 'n' }).action).toEqual({ t: 'note' });
    expect(r({ key: 't' }).action).toEqual({ t: 'theme' });
    expect(r({ key: 'Enter' }).action).toEqual({ t: 'open' });
    expect(r({ key: 'Escape' }).action).toEqual({ t: 'esc' });
  });

  it('ignora teclas sem binding', () => {
    expect(r({ key: 'z' }).action).toBeNull();
  });
});

describe('isTypingTarget', () => {
  it('detecta campos editáveis', () => {
    expect(isTypingTarget(document.createElement('input'))).toBe(true);
    expect(isTypingTarget(document.createElement('textarea'))).toBe(true);
    expect(isTypingTarget(document.createElement('div'))).toBe(false);
  });
});
