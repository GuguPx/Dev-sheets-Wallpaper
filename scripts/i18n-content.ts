/**
 * Ferramenta de tradução do CONTEÚDO (cheat sheets).
 *
 *   npx tsx scripts/i18n-content.ts extract <pasta>   gera os modelos (texto pt-BR)
 *   npx tsx scripts/i18n-content.ts check [idioma]    valida as traduções
 *
 * `extract` escreve um `<tech>.json` por tecnologia no formato de
 * `data/i18n/<idioma>/<tech>.json` (ver schemas/translation.schema.ts), já com
 * o texto em português — basta traduzir os valores e salvar na pasta do idioma.
 *
 * `check` garante que cada tradução: é JSON válido, segue o schema, só cita
 * ids/categorias que existem e tem arrays do MESMO tamanho do fonte. Mostra a
 * cobertura por idioma. Sai com código != 0 se houver erro estrutural (CI).
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { technologySchema } from '../wallpaper/src/schemas/technology.schema';
import {
  technologyTranslationSchema,
  type TechnologyTranslation,
} from '../wallpaper/src/schemas/translation.schema';
import { LANGUAGES, SOURCE_LOCALE } from '../wallpaper/src/i18n/languages';

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(here, '../wallpaper/src/data/technologies');
const i18nDir = resolve(here, '../wallpaper/src/data/i18n');

type Tech = ReturnType<typeof technologySchema.parse>;

function loadSources(): Map<string, Tech> {
  const map = new Map<string, Tech>();
  for (const f of readdirSync(srcDir).filter((x) => x.endsWith('.json'))) {
    const t = technologySchema.parse(JSON.parse(readFileSync(join(srcDir, f), 'utf8')));
    map.set(t.id, t);
  }
  return map;
}

function template(t: Tech): TechnologyTranslation {
  return {
    description: t.description,
    categories: Object.fromEntries(t.categories.map((c) => [c, c])),
    entries: Object.fromEntries(
      t.entries.map((e) => [
        e.id,
        {
          title: e.title,
          description: e.description,
          examples: e.examples.map((x) => x.explanation),
          arguments: e.arguments.map((a) => a.description),
          warnings: e.warnings,
        },
      ]),
    ),
  };
}

function extract(outDir: string): void {
  const out = resolve(outDir);
  mkdirSync(out, { recursive: true });
  for (const t of loadSources().values()) {
    writeFileSync(join(out, `${t.id}.json`), JSON.stringify(template(t), null, 2) + '\n');
    console.log(`✓ ${t.id}.json`);
  }
}

function check(only?: string): number {
  const sources = loadSources();
  let errors = 0;
  const err = (msg: string) => {
    errors++;
    console.error(`  ✗ ${msg}`);
  };

  const locales = LANGUAGES.map((l) => l.code).filter(
    (c) => c !== SOURCE_LOCALE && (!only || c === only),
  );

  for (const locale of locales) {
    const dir = join(i18nDir, locale);
    let filled = 0;
    let total = 0;
    for (const t of sources.values()) {
      for (const e of t.entries) {
        total += 2 + e.examples.length + e.arguments.length + e.warnings.length;
      }
    }
    if (!existsSync(dir)) {
      console.log(`${locale.padEnd(6)} —   sem traduções de conteúdo (usa pt-BR)`);
      continue;
    }
    console.log(`${locale}`);
    for (const file of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
      const techId = file.replace(/\.json$/, '');
      const src = sources.get(techId);
      if (!src) {
        err(`${locale}/${file}: tecnologia "${techId}" não existe`);
        continue;
      }
      let raw: unknown;
      try {
        raw = JSON.parse(readFileSync(join(dir, file), 'utf8'));
      } catch (e) {
        err(`${locale}/${file}: JSON inválido — ${(e as Error).message}`);
        continue;
      }
      const parsed = technologyTranslationSchema.safeParse(raw);
      if (!parsed.success) {
        for (const issue of parsed.error.issues.slice(0, 8)) {
          err(`${locale}/${file}: ${issue.path.join('.') || '(raiz)'}: ${issue.message}`);
        }
        continue;
      }
      const tr = parsed.data;
      for (const cat of Object.keys(tr.categories ?? {})) {
        if (!src.categories.includes(cat)) err(`${locale}/${file}: categoria "${cat}" não existe`);
      }
      const byId = new Map(src.entries.map((e) => [e.id, e]));
      for (const [id, et] of Object.entries(tr.entries ?? {})) {
        const e = byId.get(id);
        if (!e) {
          err(`${locale}/${file}: entrada "${id}" não existe`);
          continue;
        }
        const sizes: [string, unknown[] | undefined, number][] = [
          ['examples', et.examples, e.examples.length],
          ['arguments', et.arguments, e.arguments.length],
          ['warnings', et.warnings, e.warnings.length],
        ];
        for (const [name, arr, expected] of sizes) {
          if (arr && arr.length !== expected) {
            err(`${locale}/${file}: ${id}.${name} tem ${arr.length} itens, fonte tem ${expected}`);
          }
        }
        const nonEmpty = (s?: string) => (s && s.trim() ? 1 : 0);
        filled += nonEmpty(et.title) + nonEmpty(et.description);
        for (const arr of [et.examples, et.arguments, et.warnings]) {
          filled += (arr ?? []).filter((s) => s.trim()).length;
        }
      }
    }
    const pct = total ? Math.round((filled / total) * 100) : 0;
    console.log(`       cobertura: ${filled}/${total} textos (${pct}%)`);
  }

  console.log(`\n${errors} erro(s)`);
  return errors;
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === 'extract' && arg) {
  extract(arg);
} else if (cmd === 'check') {
  process.exit(check(arg) > 0 ? 1 : 0);
} else {
  console.log('uso: tsx scripts/i18n-content.ts extract <pasta> | check [idioma]');
  process.exit(1);
}
