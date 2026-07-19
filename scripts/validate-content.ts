/**
 * Valida todos os JSONs de tecnologia contra o schema Zod (seção 23).
 * Roda fora do Vite (via tsx), lendo os arquivos do disco. Sai com código != 0
 * se houver qualquer erro — pronto para CI.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { technologySchema } from '../wallpaper/src/schemas/technology.schema';

const here = dirname(fileURLToPath(import.meta.url));
const dir = resolve(here, '../wallpaper/src/data/technologies');

const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
let errorCount = 0;
let total = 0;
const ids = new Set<string>();

for (const file of files) {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  } catch (e) {
    errorCount++;
    console.error(`✗ ${file}: JSON inválido — ${(e as Error).message}`);
    continue;
  }
  const res = technologySchema.safeParse(raw);
  if (!res.success) {
    errorCount++;
    console.error(`✗ ${file}`);
    for (const issue of res.error.issues.slice(0, 12)) {
      console.error(`    ${issue.path.join('.') || '(raiz)'}: ${issue.message}`);
    }
    continue;
  }
  if (ids.has(res.data.id)) {
    errorCount++;
    console.error(`✗ ${file}: id de tecnologia duplicado "${res.data.id}"`);
  }
  ids.add(res.data.id);
  total += res.data.entries.length;
  console.log(`✓ ${file.padEnd(22)} ${String(res.data.entries.length).padStart(3)} comandos`);
}

console.log(`\n${files.length} tecnologia(s) · ${total} comandos · ${errorCount} erro(s)`);
process.exit(errorCount > 0 ? 1 : 0);
