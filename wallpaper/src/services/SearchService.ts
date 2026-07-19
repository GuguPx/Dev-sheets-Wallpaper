import type { FlatEntry } from '@/types';
import { tokenize, normalize } from '@/utils/normalize';

export interface SearchResult {
  item: FlatEntry;
  score: number;
}

export interface GroupedResults {
  technologyId: string;
  technologyName: string;
  technologyColor: string;
  results: SearchResult[];
}

/**
 * Busca local indexada (sem requisições externas — seção 11). Pontua por campo:
 * título e comando valem mais que descrição/tags. Case- e accent-insensitive.
 * Mantém um cache simples da última consulta.
 */
export class SearchService {
  private items: FlatEntry[] = [];
  private cacheQuery = '';
  private cacheResults: SearchResult[] = [];

  setIndex(items: FlatEntry[]): void {
    this.items = items;
    this.cacheQuery = '';
    this.cacheResults = [];
  }

  search(query: string, limit = 60): SearchResult[] {
    const tokens = tokenize(query);
    if (tokens.length === 0) return [];
    if (query === this.cacheQuery) return this.cacheResults.slice(0, limit);

    const results: SearchResult[] = [];
    for (const item of this.items) {
      const score = this.scoreItem(item, tokens);
      if (score > 0) results.push({ item, score });
    }
    results.sort(
      (a, b) => b.score - a.score || a.item.entry.title.localeCompare(b.item.entry.title),
    );
    this.cacheQuery = query;
    this.cacheResults = results;
    return results.slice(0, limit);
  }

  private scoreItem(item: FlatEntry, tokens: string[]): number {
    const e = item.entry;
    const title = normalize(e.title);
    const command = normalize(e.command);
    const category = normalize(e.category);
    const tags = e.tags.map(normalize);
    const searchable = e.searchableText ?? '';
    const techName = normalize(item.technologyName);

    let total = 0;
    for (const token of tokens) {
      let best = 0;
      if (command === token) best = Math.max(best, 12);
      if (command.includes(token)) best = Math.max(best, 8);
      if (title.includes(token)) best = Math.max(best, 7);
      if (title.startsWith(token)) best = Math.max(best, 9);
      if (techName.includes(token)) best = Math.max(best, 5);
      if (tags.some((t) => t.includes(token))) best = Math.max(best, 4);
      if (category.includes(token)) best = Math.max(best, 3);
      if (searchable.includes(token)) best = Math.max(best, 2);
      // Todo token precisa casar em algum campo (AND); senão descarta o item.
      if (best === 0) return 0;
      total += best;
    }
    return total;
  }

  /** Agrupa resultados por tecnologia. */
  group(results: SearchResult[]): GroupedResults[] {
    const map = new Map<string, GroupedResults>();
    for (const r of results) {
      const id = r.item.technologyId;
      let g = map.get(id);
      if (!g) {
        g = {
          technologyId: id,
          technologyName: r.item.technologyName,
          technologyColor: r.item.technologyColor,
          results: [],
        };
        map.set(id, g);
      }
      g.results.push(r);
    }
    return [...map.values()].sort(
      (a, b) => (b.results[0]?.score ?? 0) - (a.results[0]?.score ?? 0),
    );
  }
}

export const search = new SearchService();
