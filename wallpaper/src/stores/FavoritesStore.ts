import { Store } from '@/core/Store';
import type { FavoriteItem } from '@/types';
import { readLocal, writeLocal } from '@/services/StorageService';
import { ContentService } from '@/services/ContentService';
import { bus } from '@/core/EventBus';

interface FavoritesState {
  items: FavoriteItem[];
}

/** Favoritos (bookmarks de terminal), persistidos em localStorage (seção 12). */
class FavoritesStoreImpl extends Store<FavoritesState> {
  constructor() {
    super({ items: readLocal<FavoriteItem[]>('favorites', []) });
    this.subscribe(() => {
      writeLocal('favorites', this.getState().items);
      bus.emit('favorites:changed');
    });
  }

  has(technologyId: string, entryId: string): boolean {
    const key = ContentService.key(technologyId, entryId);
    return this.getState().items.some((f) => f.key === key);
  }

  toggle(technologyId: string, entryId: string): boolean {
    const key = ContentService.key(technologyId, entryId);
    const items = this.getState().items;
    const exists = items.some((f) => f.key === key);
    if (exists) {
      this.setState({ items: items.filter((f) => f.key !== key) });
      return false;
    }
    this.setState({
      items: [...items, { key, technologyId, entryId, addedAt: Date.now() }],
    });
    return true;
  }

  remove(key: string): void {
    this.setState({ items: this.getState().items.filter((f) => f.key !== key) });
  }

  list(): FavoriteItem[] {
    return [...this.getState().items].sort((a, b) => b.addedAt - a.addedAt);
  }

  get count(): number {
    return this.getState().items.length;
  }
}

export const favoritesStore = new FavoritesStoreImpl();
