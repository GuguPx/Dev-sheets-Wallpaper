import type { CheatEntry, FlatEntry, Technology } from '@/types';
import { technologySchema } from '@/schemas/technology.schema';
import {
  technologyTranslationSchema,
  type TechnologyTranslation,
} from '@/schemas/translation.schema';
import { loadRawTechnologies, loadRawTranslations } from '@/data';
import { buildSearchableText } from '@/utils/normalize';
import { effectiveRisk } from '@/utils/risk';
import { titleCase } from '@/utils/format';
import { SOURCE_LOCALE, isLocale, type Locale } from '@/i18n/languages';

export interface ContentLoadResult {
  technologies: Technology[];
  errors: { source: string; message: string }[];
}

/** Texto traduzido se presente e não vazio; senão o original (pt-BR). */
function pick(translated: string | undefined, original: string): string {
  return translated && translated.trim() ? translated : original;
}

/**
 * Carrega e valida todo o conteúdo (JSONs embutidos). Dados inválidos NÃO são
 * carregados silenciosamente: os erros são coletados e exibidos (seção 23 —
 * "não iniciar com dados inválidos").
 *
 * Idiomas: o JSON de cada tecnologia é a fonte (pt-BR). `setLocale()` aplica por
 * cima as traduções de `data/i18n/<idioma>/` campo a campo — ids, comandos,
 * flags, risco e chaves de categoria nunca mudam, então favoritos, notas e
 * histórico continuam valendo em qualquer idioma.
 */
export class ContentService {
  /** Tecnologias-fonte (pt-BR), já finalizadas. */
  private base: Technology[] = [];
  private technologies: Technology[] = [];
  private byId = new Map<string, Technology>();
  private flat: FlatEntry[] = [];
  private errors: { source: string; message: string }[] = [];
  private translations = new Map<string, Map<string, TechnologyTranslation>>();
  private locale: Locale = SOURCE_LOCALE;

  /** Compõe a chave global tech:entry. */
  static key(technologyId: string, entryId: string): string {
    return `${technologyId}:${entryId}`;
  }

  load(): ContentLoadResult {
    this.base = [];
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
        const idx = this.base.findIndex((t) => t.id === tech.id);
        if (idx >= 0) this.base.splice(idx, 1);
      }
      seenIds.add(tech.id);
      this.base.push(this.finalize(tech));
    }

    this.base.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    this.loadTranslations();
    this.applyLocale();
    return { technologies: this.technologies, errors: this.errors };
  }

  /** Troca o idioma do conteúdo (no-op se igual). */
  setLocale(locale: Locale): void {
    if (locale === this.locale && this.technologies.length) return;
    this.locale = locale;
    this.applyLocale();
  }

  getLocale(): Locale {
    return this.locale;
  }

  /** Deriva prompt e risco efetivo de cada entrada (independe de idioma). */
  private finalize(tech: Technology): Technology {
    const prompt = tech.prompt && tech.prompt.trim() ? tech.prompt.trim() : tech.id;
    const entries = tech.entries.map((e): CheatEntry => ({
      ...e,
      risk: effectiveRisk(e.risk, e.command),
    }));
    return { ...tech, prompt, entries };
  }

  /** Valida e indexa as traduções embutidas. Inválidas são reportadas e ignoradas. */
  private loadTranslations(): void {
    this.translations.clear();
    const known = new Set(this.base.map((t) => t.id));
    for (const raw of loadRawTranslations()) {
      if (!isLocale(raw.locale) || raw.locale === SOURCE_LOCALE) {
        this.errors.push({ source: raw.path, message: `idioma desconhecido: ${raw.locale}` });
        continue;
      }
      if (!known.has(raw.technologyId)) {
        this.errors.push({
          source: raw.path,
          message: `tecnologia inexistente: ${raw.technologyId}`,
        });
        continue;
      }
      const parsed = technologyTranslationSchema.safeParse(raw.data);
      if (!parsed.success) {
        const first = parsed.error.issues[0];
        this.errors.push({
          source: raw.path,
          message: first ? `${first.path.join('.')}: ${first.message}` : 'inválido',
        });
        continue;
      }
      let byTech = this.translations.get(raw.locale);
      if (!byTech) {
        byTech = new Map();
        this.translations.set(raw.locale, byTech);
      }
      byTech.set(raw.technologyId, parsed.data);
    }
  }

  private applyLocale(): void {
    const overlays = this.translations.get(this.locale);
    this.technologies = this.base.map((t) => this.localize(t, overlays?.get(t.id)));
    this.byId.clear();
    for (const t of this.technologies) this.byId.set(t.id, t);
    this.rebuildFlat();
  }

  /** Aplica a tradução (se houver) e recalcula o texto pesquisável no idioma. */
  private localize(tech: Technology, tr: TechnologyTranslation | undefined): Technology {
    const categoryLabels: Record<string, string> = {};
    for (const c of tech.categories) categoryLabels[c] = pick(tr?.categories?.[c], titleCase(c));

    const entries = tech.entries.map((e): CheatEntry => {
      const et = tr?.entries?.[e.id];
      const title = pick(et?.title, e.title);
      const description = pick(et?.description, e.description);
      const examples = e.examples.map((x, i) => ({
        ...x,
        explanation: pick(et?.examples?.[i], x.explanation),
      }));
      const args = e.arguments.map((a, i) => ({
        ...a,
        description: pick(et?.arguments?.[i], a.description),
      }));
      const warnings = e.warnings.map((w, i) => pick(et?.warnings?.[i], w));
      const categoryLabel = categoryLabels[e.category] ?? titleCase(e.category);
      const searchableText = buildSearchableText([
        title,
        e.command,
        description,
        e.category,
        categoryLabel,
        e.tags,
        e.relatedCommands,
        examples.map((x) => `${x.code} ${x.explanation}`),
        tech.name,
        tech.shortName,
      ]);
      return {
        ...e,
        title,
        description,
        examples,
        arguments: args,
        warnings,
        categoryLabel,
        searchableText,
      };
    });

    return {
      ...tech,
      description: pick(tr?.description, tech.description),
      categoryLabels,
      entries,
    };
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

  /** Rótulo de exibição da categoria no idioma ativo (a chave interna não muda). */
  categoryLabel(technologyId: string, category: string): string {
    return this.byId.get(technologyId)?.categoryLabels?.[category] ?? titleCase(category);
  }

  /** Idiomas que têm tradução de conteúdo embutida (além do pt-BR). */
  translatedLocales(): Locale[] {
    return [...this.translations.keys()] as Locale[];
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
