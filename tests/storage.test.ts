import { describe, it, expect, beforeEach } from 'vitest';
import { readLocal, writeLocal, removeLocal } from '@/services/StorageService';
import { favoritesStore } from '@/stores/FavoritesStore';

beforeEach(() => localStorage.clear());

describe('StorageService (localStorage)', () => {
  it('grava e lê objetos', () => {
    writeLocal('demo', { a: 1, b: ['x'] });
    expect(readLocal('demo', null)).toEqual({ a: 1, b: ['x'] });
  });

  it('retorna fallback quando a chave não existe', () => {
    expect(readLocal('inexistente', 42)).toBe(42);
  });

  it('retorna fallback com JSON corrompido (degrada com segurança)', () => {
    localStorage.setItem('devsheet:corrupto', '{ isto não é json');
    expect(readLocal('corrupto', [])).toEqual([]);
  });

  it('remove chaves', () => {
    writeLocal('temp', 1);
    removeLocal('temp');
    expect(readLocal('temp', 'default')).toBe('default');
  });

  it('usa o prefixo devsheet:', () => {
    writeLocal('k', 1);
    expect(localStorage.getItem('devsheet:k')).toBe('1');
  });
});

describe('FavoritesStore', () => {
  it('alterna favoritos e persiste', () => {
    const added = favoritesStore.toggle('git', 'git-status');
    expect(added).toBe(true);
    expect(favoritesStore.has('git', 'git-status')).toBe(true);
    const removed = favoritesStore.toggle('git', 'git-status');
    expect(removed).toBe(false);
    expect(favoritesStore.has('git', 'git-status')).toBe(false);
  });
});
