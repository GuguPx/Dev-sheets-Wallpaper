/**
 * Barramento de eventos global, tipado. Usado para ações transversais
 * (trocar de modo, abrir manual, copiar comando, toast) sem acoplar painéis.
 */
import type { EntryKey, Mode, UsageAction } from '@/types';

export interface AppEvents {
  'mode:change': { mode: Mode };
  'technology:select': { technologyId: string };
  'category:select': { category: string | null };
  'entry:focus': { key: EntryKey | null };
  'manual:open': { key: EntryKey };
  'manual:close': void;
  'search:open': void;
  'search:close': void;
  'command:submit': { line: string };
  'entry:used': { technologyId: string; entryId: string; action: UsageAction };
  toast: { message: string; kind?: 'info' | 'success' | 'warning' | 'danger'; timeout?: number };
  'theme:changed': { theme: string };
  'data:changed': void;
  'notes:changed': void;
  'favorites:changed': void;
  /** Solicita re-render global da shell. */
  render: void;
}

type Handler<T> = (payload: T) => void;

class EventBusImpl {
  private handlers = new Map<keyof AppEvents, Set<Handler<unknown>>>();

  on<K extends keyof AppEvents>(event: K, handler: Handler<AppEvents[K]>): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler as Handler<unknown>);
    return () => set!.delete(handler as Handler<unknown>);
  }

  emit<K extends keyof AppEvents>(
    event: K,
    ...payload: AppEvents[K] extends void ? [] : [AppEvents[K]]
  ): void {
    const set = this.handlers.get(event);
    if (!set) return;
    const data = (payload[0] ?? undefined) as AppEvents[K];
    for (const handler of set) (handler as Handler<AppEvents[K]>)(data);
  }
}

export const bus = new EventBusImpl();
