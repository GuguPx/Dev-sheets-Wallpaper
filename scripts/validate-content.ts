/**
 * Valida todo o conteúdo contra os schemas Zod (seção 23): as sheets em
 * `technologies/` e os comandos avulsos em `entries/<tech>/<id>.json`, já
 * juntos com a mesma regra do runtime. Roda fora do Vite (via tsx). Sai com
 * código != 0 se houver qualquer erro — pronto para CI.
 */
import { readContent } from './lib/content';

const content = readContent();

for (const err of content.errors) {
  console.error(`✗ ${err.source}`);
  console.error(`    ${err.message}`);
}

for (const tech of [...content.technologies].sort((a, b) => a.id.localeCompare(b.id))) {
  console.log(
    `✓ ${(tech.id + '.json').padEnd(22)} ${String(tech.entries.length).padStart(3)} comandos`,
  );
}

const total = content.technologies.reduce((n, t) => n + t.entries.length, 0);
console.log(
  `\n${content.technologies.length} tecnologia(s) · ${total} comandos` +
    (content.entryFiles ? ` (${content.contributed} em entries/)` : '') +
    ` · ${content.errors.length} erro(s)`,
);
process.exit(content.errors.length > 0 ? 1 : 0);
