import { beforeEach } from 'vitest';

/**
 * Ambiente de teste: garante APIs de browser que o jsdom não expõe de forma
 * completa (localStorage sem `clear`, matchMedia). Instalado antes de qualquer
 * import de store, pois os stores leem o storage no construtor.
 */

// localStorage em memória (robusto entre versões do jsdom).
class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

const needsPolyfill =
  typeof localStorage === 'undefined' || typeof localStorage.clear !== 'function';
if (needsPolyfill) {
  const ls = new MemoryStorage();
  Object.defineProperty(globalThis, 'localStorage', {
    value: ls,
    configurable: true,
    writable: true,
  });
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
      value: ls,
      configurable: true,
      writable: true,
    });
  }
}

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent() {
      return false;
    },
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  localStorage.clear();
});
