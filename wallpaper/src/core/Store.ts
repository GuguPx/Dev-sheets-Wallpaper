/**
 * Store reativa mínima (pub/sub). Sem dependências externas.
 * Suporta seleção de slice para re-render direcionado.
 */
export type Listener<T> = (state: T, prev: T) => void;
export type Unsubscribe = () => void;

export class Store<T extends object> {
  private state: T;
  private listeners = new Set<Listener<T>>();

  constructor(initial: T) {
    this.state = initial;
  }

  getState(): T {
    return this.state;
  }

  /**
   * Atualiza o estado (merge raso) e notifica os assinantes.
   * Aceita objeto parcial ou função updater.
   */
  setState(patch: Partial<T> | ((s: T) => Partial<T>)): void {
    const prev = this.state;
    const delta = typeof patch === 'function' ? patch(prev) : patch;
    const next = { ...prev, ...delta };
    // Evita notificação quando nada muda (comparação rasa das chaves alteradas).
    let changed = false;
    for (const k in delta) {
      if (!Object.is((prev as Record<string, unknown>)[k], (next as Record<string, unknown>)[k])) {
        changed = true;
        break;
      }
    }
    if (!changed) return;
    this.state = next;
    for (const l of this.listeners) l(next, prev);
  }

  subscribe(listener: Listener<T>): Unsubscribe {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Assina apenas mudanças de um slice derivado, com comparação por igualdade.
   * Retorna a função de desinscrição.
   */
  select<S>(
    selector: (s: T) => S,
    listener: (value: S, prev: S) => void,
    isEqual: (a: S, b: S) => boolean = Object.is,
  ): Unsubscribe {
    let current = selector(this.state);
    return this.subscribe((state) => {
      const next = selector(state);
      if (!isEqual(next, current)) {
        const prev = current;
        current = next;
        listener(next, prev);
      }
    });
  }
}
