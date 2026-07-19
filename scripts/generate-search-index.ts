/**
 * Gera um índice de busca pré-computado (seção 28) a partir dos JSONs de
 * tecnologia e o grava em `search-index.json` na raiz do projeto. O runtime já
 * constrói o índice ao iniciar; este artefato é útil para inspeção/CI e para
 * ferramentas externas. Não é consumido pelo bundle.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { technologySchema } from '../wallpaper/src/schemas/technology.schema';
import { buildSearchableText } from '../wallpaper/src/utils/normalize';

const here = dirname(fileURLToPath(import.meta.url));
const dir = resolve(here, '../wallpaper/src/data/technologies');
const out = resolve(here, '../search-index.json');

interface IndexRow {
  technologyId: string;
  technologyName: string;
  entryId: string;
  command: string;
  title: string;
  category: string;
  risk: string;
  tags: string[];
  searchable: string;
}

const rows: IndexRow[] = [];
for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const parsed = technologySchema.safeParse(JSON.parse(readFileSync(join(dir, file), 'utf8')));
  if (!parsed.success) {
    console.error(`✗ ${file}: inválido (rode validate:content)`);
    process.exit(1);
  }
  const tech = parsed.data;
  for (const e of tech.entries) {
    rows.push({
      technologyId: tech.id,
      technologyName: tech.name,
      entryId: e.id,
      command: e.command,
      title: e.title,
      category: e.category,
      risk: e.risk,
      tags: e.tags ?? [],
      searchable: buildSearchableText([
        e.title,
        e.command,
        e.description,
        e.category,
        e.tags,
        tech.name,
        tech.shortName,
      ]),
    });
  }
}

writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), rows }, null, 0));
console.log(`Índice gerado: ${rows.length} entradas → ${out}`);
