import type { CheatEntry, FlatEntry, Technology } from '@/types';
import { technologySchema } from '@/schemas/technology.schema';
import { loadRawTechnologies } from '@/data';
import { buildSearchableText } from '@/utils/normalize';
import { effectiveRisk } from '@/utils/risk';

export interface ContentLoadResult {
  technologies: Technology[];
  errors: { source: string; message: string }[];
}

/**
 * Carrega e valida todo o conteúdo (JSONs embutidos). Dados inválidos NÃO são
 * carregados silenciosamente: os erros são coletados e exibidos (seção 23 —
 * "não iniciar com dados inválidos").
 */
export class ContentService {
  private technologies: Technology[] = [];
  private byId = new Map<string, Technology>();
  private flat: FlatEntry[] = [];
  private errors: { source: string; message: string }[] = [];

  /** Compõe a chave global tech:entry. */
  static key(technologyId: string, entryId: string): string {
    return `${technologyId}:${entryId}`;
  }

  load(): ContentLoadResult {
    this.technologies = [];
    this.byId.clear();
    this.flat = [];
    this.errors = [];

    const raws = loadRawTechnologies().map((m) => ({ source: m.path, data: m.data }));

    const seenIds = new Set<string>();
    for (const raw of raws) {
      const parsed = technologySchema.safeParse(raw.data);
      if (!parsed.success) {
        const first = parsed.error.issues[0];
        this.errors.push({
          source: raw.source,
          message: first ? `${first.path.join('.')}: ${first.message}` : 'inválido',
        });
        continue;
      }
      const tech = parsed.data as unknown as Technology;
      if (seenIds.has(tech.id)) {
        const idx = this.technologies.findIndex((t) => t.id === tech.id);
        if (idx >= 0) this.technologies.splice(idx, 1);
      }
      seenIds.add(tech.id);
      this.technologies.push(this.finalize(tech));
    }

    this.technologies.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    for (const t of this.technologies) this.byId.set(t.id, t);
    this.rebuildFlat();
    return { technologies: this.technologies, errors: this.errors };
  }

  /** Deriva prompt, risco efetivo e texto pesquisável de cada entrada. */
  private finalize(tech: Technology): Technology {
    const prompt = tech.prompt && tech.prompt.trim() ? tech.prompt.trim() : tech.id;
    const entries = tech.entries.map((e): CheatEntry => {
      const risk = effectiveRisk(e.risk, e.command);
      const searchableText = buildSearchableText([
        e.title,
        e.command,
        e.description,
        e.category,
        e.tags,
        e.relatedCommands,
        e.examples.map((x) => `${x.code} ${x.explanation}`),
        tech.name,
        tech.shortName,
      ]);
      return { ...e, risk, searchableText };
    });
    return { ...tech, prompt, entries };
  }

  private rebuildFlat(): void {
    this.flat = [];
    for (const tech of this.technologies) {
      for (const entry of tech.entries) {
        this.flat.push({
          entry,
          technologyId: tech.id,
          technologyName: tech.name,
          technologyShortName: tech.shortName,
          technologyColor: tech.color,
        });
      }
    }
  }

  getTechnologies(): Technology[] {
    return this.technologies;
  }

  getTechnology(id: string): Technology | undefined {
    return this.byId.get(id);
  }

  getFlatEntries(): FlatEntry[] {
    return this.flat;
  }

  getEntry(technologyId: string, entryId: string): FlatEntry | undefined {
    return this.flat.find((f) => f.technologyId === technologyId && f.entry.id === entryId);
  }

  getEntryByKey(key: string): FlatEntry | undefined {
    const [tech, ...rest] = key.split(':');
    return this.getEntry(tech, rest.join(':'));
  }

  /** Entradas de uma tecnologia, opcionalmente filtradas por categoria. */
  entriesFor(technologyId: string, category: string | null): CheatEntry[] {
    const tech = this.byId.get(technologyId);
    if (!tech) return [];
    return category ? tech.entries.filter((e) => e.category === category) : tech.entries;
  }

  getErrors(): { source: string; message: string }[] {
    return this.errors;
  }

  get totalEntries(): number {
    return this.flat.length;
  }

  get totalTechnologies(): number {
    return this.technologies.length;
  }
}

export const content = new ContentService();
