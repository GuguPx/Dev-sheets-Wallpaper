import { Store } from '@/core/Store';
import type { ActivityItem, HistoryEntry, UsageAction, UsageStat } from '@/types';
import { readLocal, writeLocal } from '@/services/StorageService';
import { ContentService } from '@/services/ContentService';

/** Pesos de pontuação de uso (seção 13 da spec). */
const WEIGHTS: Record<UsageAction, number> = {
  open: 1,
  'search-select': 2,
  copy: 3,
  favorite: 5,
};

const MAX_HISTORY = 200;
const MAX_ACTIVITY = 200;

interface HistoryState {
  history: HistoryEntry[];
  usage: Record<string, UsageStat>;
  activity: ActivityItem[];
}

/**
 * Histórico de consultas + estatística de "mais usados" + log de atividade
 * legível (seções 13). Tudo local; nenhum dado sai do dispositivo.
 */
class HistoryStoreImpl extends Store<HistoryState> {
  constructor() {
    super({
      history: readLocal<HistoryEntry[]>('history', []),
      usage: readLocal<Record<string, UsageStat>>('usage', {}),
      activity: readLocal<ActivityItem[]>('activity', []),
    });
    this.subscribe(() => {
      writeLocal('history', this.getState().history);
      writeLocal('usage', this.getState().usage);
      writeLocal('activity', this.getState().activity);
    });
  }

  record(technologyId: string, entryId: string, action: UsageAction): void {
    const key = ContentService.key(technologyId, entryId);
    const now = Date.now();
    const state = this.getState();

    const history = [{ key, technologyId, entryId, action, at: now }, ...state.history].slice(
      0,
      MAX_HISTORY,
    );

    const prev: UsageStat = state.usage[key] ?? {
      key,
      technologyId,
      entryId,
      score: 0,
      opens: 0,
      copies: 0,
      favorites: 0,
      searchSelects: 0,
      lastUsedAt: now,
    };
    const stat: UsageStat = { ...prev, score: prev.score + WEIGHTS[action], lastUsedAt: now };
    if (action === 'open') stat.opens += 1;
    else if (action === 'copy') stat.copies += 1;
    else if (action === 'favorite') stat.favorites += 1;
    else if (action === 'search-select') stat.searchSelects += 1;

    this.setState({ history, usage: { ...state.usage, [key]: stat } });
  }

  logActivity(item: ActivityItem): void {
    this.setState({ activity: [item, ...this.getState().activity].slice(0, MAX_ACTIVITY) });
  }

  recentActivity(limit = 30): ActivityItem[] {
    return this.getState().activity.slice(0, limit);
  }

  mostUsed(limit = 10): UsageStat[] {
    return Object.values(this.getState().usage)
      .sort((a, b) => b.score - a.score || b.lastUsedAt - a.lastUsedAt)
      .slice(0, limit);
  }

  clearHistory(): void {
    this.setState({ history: [], usage: {}, activity: [] });
  }
}

export const historyStore = new HistoryStoreImpl();
