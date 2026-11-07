/**
 * Lê o conteúdo do disco (fora do Vite) e o junta com a MESMA regra do runtime
 * (`wallpaper/src/data/merge.ts`): sheets em `technologies/` + comandos avulsos
 * em `entries/<tech>/<id>.json`. Usado pelos scripts de validação, i18n, índice
 * e pelo assistente `npm run new`.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';
import {
  mergeContent,
  type ContentError,
  type MergeResult,
  type RawContentFile,
  type RawEntryFile,
} from '../../wallpaper/src/data/merge';

const here = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(here, '../..');
export const DATA_DIR = resolve(ROOT, 'wallpaper/src/data');
export const TECH_DIR = join(DATA_DIR, 'technologies');
export const ENTRIES_DIR = join(DATA_DIR, 'entries');

const rel = (p: string) => relative(ROOT, p).replace(/\\/g, '/');

function readJson(path: string, errors: ContentError[]): unknown | undefined {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    errors.push({ source: rel(path), message: `JSON inválido — ${(e as Error).message}` });
    return undefined;
  }
}

export interface DiskContent extends MergeResult {
  techFiles: number;
  entryFiles: number;
}

export function readContent(): DiskContent {
  const parseErrors: ContentError[] = [];

  const techFiles: RawContentFile[] = [];
  for (const f of readdirSync(TECH_DIR)
    .filter((x) => x.endsWith('.json'))
    .sort()) {
    const path = join(TECH_DIR, f);
    const data = readJson(path, parseErrors);
    if (data !== undefined) techFiles.push({ source: rel(path), data });
  }

  const entryFiles: RawEntryFile[] = [];
  if (existsSync(ENTRIES_DIR)) {
    for (const techId of readdirSync(ENTRIES_DIR).sort()) {
      const dir = join(ENTRIES_DIR, techId);
      if (!statSync(dir).isDirectory()) continue;
      for (const f of readdirSync(dir)
        .filter((x) => x.endsWith('.json'))
        .sort()) {
        const path = join(dir, f);
        const data = readJson(path, parseErrors);
        if (data !== undefined) {
          entryFiles.push({
            source: rel(path),
            technologyId: techId,
            fileId: f.replace(/\.json$/, ''),
            data,
          });
        }
      }
    }
  }

  const merged = mergeContent(techFiles, entryFiles);
  return {
    ...merged,
    errors: [...parseErrors, ...merged.errors],
    techFiles: techFiles.length,
    entryFiles: entryFiles.length,
  };
}
