/**
 * Gera um índice de busca pré-computado (seção 28) a partir dos JSONs de
 * tecnologia e o grava em `search-index.json` na raiz do projeto. O runtime já
 * constrói o índice ao iniciar; este artefato é útil para inspeção/CI e para
 * ferramentas externas. Não é consumido pelo bundle.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildSearchableText } from '../wallpaper/src/utils/normalize';
import { ROOT, readContent } from './lib/content';

const out = resolve(ROOT, 'search-index.json');

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
const content = readContent();
if (content.errors.length) {
  console.error('✗ conteúdo inválido (rode validate:content)');
  process.exit(1);
}
for (const tech of content.technologies) {
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
