/**
 * Junta o conteúdo das duas formas de contribuição, validando tudo com Zod:
 *
 *  1. `technologies/<tech>.json` — a sheet completa (metadados + comandos);
 *  2. `entries/<tech>/<id>.json` — UM comando por arquivo, somado à sheet `<tech>`.
 *
 * A forma 2 é a porta de entrada da comunidade: cada contribuição é um arquivo
 * novo, então PRs de pessoas diferentes nunca conflitam, e o editor web consegue
 * abrir o arquivo pronto direto no GitHub. Categoria nova citada por um comando
 * é acrescentada ao fim das categorias da sheet.
 *
 * Função pura (sem Vite/Node): usada no runtime (ContentService) e nos scripts
 * de validação/i18n, que só mudam a forma de ler os arquivos.
 */
import { technologySchema, type TechnologyParsed } from '../schemas/technology.schema';
import { cheatEntrySchema } from '../schemas/cheat-entry.schema';

export interface RawContentFile {
  /** Caminho de origem (para mensagens de erro). */
  source: string;
  data: unknown;
}

export interface RawEntryFile extends RawContentFile {
  /** Pasta do arquivo: `entries/<technologyId>/`. */
  technologyId: string;
  /** Nome do arquivo sem `.json` — deve ser igual ao `id` do comando. */
  fileId: string;
}

export interface ContentError {
  source: string;
  message: string;
}

export interface MergeResult {
  technologies: TechnologyParsed[];
  errors: ContentError[];
  /** Quantos comandos vieram de `entries/`. */
  contributed: number;
}

function firstIssue(err: { issues: { path: (string | number)[]; message: string }[] }): string {
  const i = err.issues[0];
  return i ? `${i.path.join('.') || '(raiz)'}: ${i.message}` : 'inválido';
}

export function mergeContent(techFiles: RawContentFile[], entryFiles: RawEntryFile[]): MergeResult {
  const errors: ContentError[] = [];
  const byId = new Map<string, TechnologyParsed>();

  for (const raw of techFiles) {
    const parsed = technologySchema.safeParse(raw.data);
    if (!parsed.success) {
      errors.push({ source: raw.source, message: firstIssue(parsed.error) });
      continue;
    }
    // id repetido: o último arquivo vence (comportamento histórico).
    byId.set(parsed.data.id, {
      ...parsed.data,
      categories: [...parsed.data.categories],
      entries: [...parsed.data.entries],
    });
  }

  let contributed = 0;
  const sorted = [...entryFiles].sort((a, b) => a.source.localeCompare(b.source));
  for (const raw of sorted) {
    const parsed = cheatEntrySchema.safeParse(raw.data);
    if (!parsed.success) {
      errors.push({ source: raw.source, message: firstIssue(parsed.error) });
      continue;
    }
    const entry = parsed.data;
    if (entry.id !== raw.fileId) {
      errors.push({
        source: raw.source,
        message: `o nome do arquivo deve ser o id do comando: renomeie para "${entry.id}.json"`,
      });
      continue;
    }
    const tech = byId.get(raw.technologyId);
    if (!tech) {
      errors.push({
        source: raw.source,
        message: `tecnologia "${raw.technologyId}" não existe (crie technologies/${raw.technologyId}.json)`,
      });
      continue;
    }
    if (tech.entries.some((e) => e.id === entry.id)) {
      errors.push({
        source: raw.source,
        message: `id "${entry.id}" já existe em ${raw.technologyId} — escolha outro id`,
      });
      continue;
    }
    if (!tech.categories.includes(entry.category)) tech.categories.push(entry.category);
    tech.entries.push(entry);
    contributed++;
  }

  return { technologies: [...byId.values()], errors, contributed };
}
