import { bus } from '@/core/EventBus';
import { historyStore } from '@/stores/HistoryStore';
import { settingsStore } from '@/stores/SettingsStore';
import { content } from '@/services/ContentService';
import type { ActivityKind } from '@/types';

/**
 * "Analytics" estritamente LOCAL (seções 13 e 27). Escuta o evento `entry:used`
 * e delega ao HistoryStore (usagem + log legível). Nenhum dado sai do device.
 */
export function initLocalAnalytics(): void {
  bus.on('entry:used', ({ technologyId, entryId, action }) => {
    if (!settingsStore.getState().enableHistory) return;
    historyStore.record(technologyId, entryId, action);

    const flat = content.getEntry(technologyId, entryId);
    const label = flat ? flat.entry.command : `${technologyId}:${entryId}`;
    const kind: ActivityKind =
      action === 'copy' ? 'copy' : action === 'favorite' ? 'favorite' : 'view';
    historyStore.logActivity({ at: Date.now(), kind, label });
  });
}
