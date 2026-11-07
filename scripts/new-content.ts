/**
 * Assistente para adicionar conteúdo sem editar JSON na mão.
 *
 *   npm run new            pergunta o que você quer criar
 *   npm run new:cmd        novo comando numa tecnologia existente
 *   npm run new:sheet      nova tecnologia (sheet) com o primeiro comando
 *
 * Gera arquivos no formato certo, sugere id e nível de risco, valida com os
 * mesmos schemas Zod do app e confere se o conjunto continua válido.
 *  - comando novo  → wallpaper/src/data/entries/<tech>/<id>.json
 *  - sheet nova    → wallpaper/src/data/technologies/<id>.json
 *
 * Funciona digitando no terminal ou com entrada redirecionada (uma resposta
 * por linha), o que ajuda em testes.
 */
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createInterface } from 'node:readline';
import { cheatEntrySchema } from '../wallpaper/src/schemas/cheat-entry.schema';
import { technologySchema } from '../wallpaper/src/schemas/technology.schema';
import { detectRisk } from '../wallpaper/src/utils/risk';
import { ENTRIES_DIR, ROOT, TECH_DIR, readContent } from './lib/content';

// ------------------------------------------------------------------ terminal

const tty = Boolean(process.stdout.isTTY);
const c = (code: string) => (s: string) => (tty ? `\x1b[${code}m${s}\x1b[0m` : s);
const bold = c('1');
const dim = c('2');
const green = c('32');
const yellow = c('33');
const red = c('31');
const cyan = c('36');

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: Boolean(process.stdin.isTTY),
});
const queue: string[] = [];
let waiter: ((line: string | null) => void) | null = null;
let closed = false;
rl.on('line', (line) => {
  if (waiter) {
    const w = waiter;
    waiter = null;
    w(line);
  } else queue.push(line);
});
rl.on('close', () => {
  closed = true;
  if (waiter) {
    const w = waiter;
    waiter = null;
    w(null);
  }
});

class Abort extends Error {}

function readLine(prompt: string): Promise<string> {
  rl.setPrompt(prompt);
  rl.prompt();
  if (queue.length) {
    const line = queue.shift() as string;
    if (!process.stdin.isTTY) process.stdout.write(line + '\n');
    return Promise.resolve(line);
  }
  if (closed) return Promise.reject(new Abort('entrada encerrada'));
  return new Promise((resolve, reject) => {
    waiter = (line) => {
      if (line === null) reject(new Abort('entrada encerrada'));
      else {
        if (!process.stdin.isTTY) process.stdout.write(line + '\n');
        resolve(line);
      }
    };
  });
}

interface AskOpts {
  def?: string;
  required?: boolean;
  validate?: (v: string) => string | null;
  hint?: string;
}

async function ask(label: string, opts: AskOpts = {}): Promise<string> {
  const { def, required = true, validate, hint } = opts;
  if (hint) console.log(dim(`  ${hint}`));
  for (;;) {
    const suffix = def ? dim(` [${def}]`) : '';
    const raw = (await readLine(`${cyan('?')} ${label}${suffix}: `)).trim();
    const v = raw || def || '';
    if (!v && required) {
      console.log(red('  obrigatório'));
      continue;
    }
    const err = v && validate ? validate(v) : null;
    if (err) {
      console.log(red(`  ${err}`));
      continue;
    }
    return v;
  }
}

async function choose<T extends string>(
  label: string,
  options: { value: T; label: string }[],
  def?: T,
): Promise<T> {
  console.log(`${cyan('?')} ${label}`);
  options.forEach((o, i) => console.log(`  ${bold(String(i + 1))}) ${o.label}`));
  const defIdx = def ? options.findIndex((o) => o.value === def) + 1 : 0;
  for (;;) {
    const raw = await ask('número', { def: defIdx ? String(defIdx) : undefined });
    const n = Number(raw);
    if (Number.isInteger(n) && n >= 1 && n <= options.length) return options[n - 1].value;
    const byValue = options.find((o) => o.value === raw);
    if (byValue) return byValue.value;
    console.log(red(`  escolha de 1 a ${options.length}`));
  }
}

const list = (s: string) =>
  s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

// ------------------------------------------------------------------ helpers

export function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/g, '');
}

const KEBAB = /^[a-z0-9-]+$/;
const isUrl = (v: string) => {
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};
const today = () => new Date().toISOString().slice(0, 10);

const COLORS = ['#e06c75', '#61afef', '#98c379', '#e5c07b', '#c678dd', '#56b6c2', '#d19a66'];

type Tech = ReturnType<typeof readContent>['technologies'][number];

// ------------------------------------------------------------------ comando

async function askEntry(tech: { id: string; categories: string[]; entryIds: Set<string> }) {
  console.log(`\n${bold('Comando')} ${dim('(texto em português — traduções são feitas depois)')}`);

  const title = await ask('Título curto', { hint: 'ex.: Listar branches remotas' });
  const command = await ask('Comando', {
    hint: 'ex.: git branch -r   ·   use <nome> para partes que a pessoa troca',
  });
  const description = await ask('Descrição', {
    hint: 'o que faz e quando usar (mín. 10 caracteres)',
    validate: (v) => (v.length < 10 ? 'muito curta — explique o comando' : null),
  });

  // categoria: existente ou nova
  const NEW = '__new__';
  const cat = await choose(
    'Categoria',
    [
      ...tech.categories.map((c) => ({ value: c, label: c })),
      { value: NEW, label: dim('outra (criar nova)') },
    ],
    tech.categories[0],
  );
  const category = cat === NEW ? await ask('Nome da nova categoria') : cat;

  const difficulty = await choose(
    'Dificuldade',
    [
      { value: 'basico', label: 'básico — uso diário (aparece em ★ rec)' },
      { value: 'intermediario', label: 'intermediário' },
      { value: 'avancado', label: 'avançado' },
    ],
    'basico',
  );

  const suggested = detectRisk(command);
  const risk = await choose(
    `Risco ${dim(`(sugerido pelo texto do comando: ${suggested})`)}`,
    [
      { value: 'seguro', label: 'seguro — só lê/consulta' },
      { value: 'atencao', label: 'atenção — altera algo, mas dá para desfazer' },
      { value: 'perigoso', label: 'perigoso — apaga/sobrescreve sem volta' },
    ],
    suggested,
  );

  const platforms = list(
    await ask('Plataformas', {
      def: 'all',
      hint: 'all, ou lista com linux, macos, windows',
      validate: (v) =>
        list(v).every((p) => ['all', 'linux', 'macos', 'windows'].includes(p))
          ? null
          : 'use all, linux, macos ou windows',
    }),
  );
  const tags = list(await ask('Tags (separadas por vírgula)', { required: false }));

  console.log(dim('  Exemplos — deixe o código vazio para terminar.'));
  const examples: {
    level: 'basico' | 'intermediario' | 'avancado';
    code: string;
    explanation: string;
  }[] = [];
  for (;;) {
    const code = await ask(`Exemplo ${examples.length + 1} — código`, {
      required: false,
      def: examples.length === 0 ? command : undefined,
    });
    if (!code) break;
    const explanation = await ask(`Exemplo ${examples.length + 1} — explicação`);
    examples.push({
      level: examples.length === 0 ? 'basico' : 'intermediario',
      code,
      explanation,
    });
    if (examples.length >= 6) break;
  }

  console.log(dim('  Opções/flags — deixe vazio para terminar.'));
  const args: { flag: string; description: string }[] = [];
  for (;;) {
    const flag = await ask(`Opção ${args.length + 1} — flag`, { required: false });
    if (!flag) break;
    args.push({ flag, description: await ask(`Opção ${args.length + 1} — o que faz`) });
  }

  const warnings: string[] = [];
  if (risk !== 'seguro') console.log(dim('  Avisos — o que pode dar errado? Vazio para terminar.'));
  for (;;) {
    const w = await ask(`Aviso ${warnings.length + 1}`, { required: false });
    if (!w) break;
    warnings.push(w);
  }

  const relatedCommands = list(
    await ask('Comandos relacionados (vírgula)', {
      required: false,
      hint: 'ex.: git fetch, git branch',
    }),
  );
  const documentationUrl = await ask('Link da documentação oficial', {
    required: false,
    hint: 'recomendado — não inventamos comandos',
    validate: (v) => (isUrl(v) ? null : 'URL inválida (use http/https)'),
  });

  // id sugerido: <tech>-<titulo>, único na tecnologia
  let base = slugify(`${tech.id}-${title}`);
  if (!base.startsWith(`${tech.id}-`)) base = slugify(`${tech.id}-${base}`);
  let idSug = base;
  for (let n = 2; tech.entryIds.has(idSug); n++) idSug = `${base}-${n}`;
  const id = await ask('Id do comando', {
    def: idSug,
    hint: 'kebab-case, único — vira o nome do arquivo',
    validate: (v) =>
      !KEBAB.test(v) ? 'use só a-z, 0-9 e hífen' : tech.entryIds.has(v) ? 'id já existe' : null,
  });

  const entry = {
    id,
    title,
    command,
    description,
    category,
    tags,
    difficulty,
    platforms,
    risk,
    examples,
    arguments: args,
    warnings,
    relatedCommands,
    ...(documentationUrl ? { documentationUrl } : {}),
  };
  const parsed = cheatEntrySchema.safeParse(entry);
  if (!parsed.success) {
    for (const i of parsed.error.issues) console.log(red(`  ✗ ${i.path.join('.')}: ${i.message}`));
    throw new Abort('comando inválido');
  }
  return entry;
}

// ------------------------------------------------------------------ fluxos

function writeJson(path: string, data: unknown): void {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
}

/** Valida o conjunto inteiro; se o arquivo novo quebrou algo, desfaz. */
function checkAll(path: string): boolean {
  const res = readContent();
  const relPath = relative(ROOT, path).replace(/\\/g, '/');
  const mine = res.errors.filter((e) => e.source === relPath);
  if (res.errors.length) {
    for (const e of res.errors) console.log(red(`  ✗ ${e.source}: ${e.message}`));
  }
  if (mine.length) {
    unlinkSync(path);
    console.log(yellow('  O arquivo foi removido. Corrija e rode de novo.'));
    return false;
  }
  return true;
}

function nextSteps(path: string): void {
  const relPath = relative(ROOT, path).replace(/\\/g, '/');
  console.log(`\n${green('✓')} criado ${bold(relPath)}\n`);
  console.log('Próximos passos:');
  console.log(`  1. ${cyan('npm run dev')}               confira no navegador`);
  console.log(`  2. ${cyan('npm run validate:content')}  (o CI também roda)`);
  console.log(`  3. ${cyan(`git add ${relPath}`)}`);
  console.log(`     ${cyan('git commit -m "content: ..."')} e abra um Pull Request`);
  console.log(
    dim('\n  As traduções ficam em pt-BR até alguém traduzir (npm run validate:i18n mostra).'),
  );
}

async function newCommand(techs: Tech[]): Promise<void> {
  const techId = await choose(
    'Em qual tecnologia?',
    [...techs]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((t) => ({
        value: t.id,
        label: `${t.name} ${dim(`(${t.id}, ${t.entries.length} comandos)`)}`,
      })),
  );
  const tech = techs.find((t) => t.id === techId) as Tech;
  const entry = await askEntry({
    id: tech.id,
    categories: tech.categories,
    entryIds: new Set(tech.entries.map((e) => e.id)),
  });
  const path = join(ENTRIES_DIR, tech.id, `${entry.id}.json`);
  writeJson(path, entry);
  if (checkAll(path)) nextSteps(path);
}

async function newSheet(techs: Tech[]): Promise<void> {
  const ids = new Set(techs.map((t) => t.id));
  console.log(`\n${bold('Nova tecnologia (sheet)')}`);
  const name = await ask('Nome', { hint: 'ex.: Kubernetes, GitHub Actions' });
  const id = await ask('Id', {
    def: slugify(name),
    hint: 'kebab-case — vira o nome do arquivo e a aba',
    validate: (v) =>
      !KEBAB.test(v) ? 'use só a-z, 0-9 e hífen' : ids.has(v) ? 'essa tecnologia já existe' : null,
  });
  const shortName = await ask('Nome curto', {
    def: name.length <= 24 ? name : name.slice(0, 24),
    validate: (v) => (v.length > 24 ? 'máximo 24 caracteres' : null),
  });
  const prompt = await ask('Prompt da aba', {
    def: id.length <= 24 ? id : id.slice(0, 24),
    hint: 'aparece como [n:prompt] e em usuario@devsheet:prompt$',
    validate: (v) => (v.length > 24 ? 'máximo 24 caracteres' : null),
  });
  const color = await ask('Cor de destaque', {
    def: COLORS[techs.length % COLORS.length],
    hint: 'hex, ex.: #326ce5',
    validate: (v) => (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v) ? null : 'use #rrggbb'),
  });
  const description = await ask('Descrição da tecnologia');
  const documentationUrl = await ask('Link da documentação oficial', {
    validate: (v) => (isUrl(v) ? null : 'URL inválida (use http/https)'),
  });
  const version = await ask('Versão de referência', { def: 'latest' });
  const categories = list(
    await ask('Categorias (vírgula)', { hint: 'ex.: Pods, Deployments, Logs' }),
  );
  console.log(
    dim(
      '  Toda sheet nasce com pelo menos 1 comando. Os próximos você adiciona com npm run new:cmd.',
    ),
  );
  const entry = await askEntry({ id, categories, entryIds: new Set() });
  const finalCategories = categories.includes(entry.category)
    ? categories
    : [...categories, entry.category];

  const tech = {
    id,
    name,
    shortName,
    prompt,
    icon: 'terminal',
    color,
    description,
    documentationUrl,
    version,
    lastReviewedAt: today(),
    categories: finalCategories,
    entries: [entry],
  };
  const parsed = technologySchema.safeParse(tech);
  if (!parsed.success) {
    for (const i of parsed.error.issues) console.log(red(`  ✗ ${i.path.join('.')}: ${i.message}`));
    throw new Abort('sheet inválida');
  }
  const path = join(TECH_DIR, `${id}.json`);
  if (existsSync(path)) throw new Abort(`já existe ${path}`);
  writeJson(path, tech);
  if (checkAll(path)) nextSteps(path);
}

async function main(): Promise<void> {
  const content = readContent();
  if (content.errors.length) {
    console.log(red('O conteúdo atual tem erros — corrija antes (npm run validate:content):'));
    for (const e of content.errors) console.log(red(`  ✗ ${e.source}: ${e.message}`));
    process.exitCode = 1;
    return;
  }
  console.log(bold('\ndevsheet · novo conteúdo'));
  console.log(dim('Prefere um formulário? Use o editor web (link no README).\n'));

  const mode = process.argv[2];
  const what =
    mode === 'cmd' || mode === 'sheet'
      ? mode
      : await choose('O que você quer adicionar?', [
          { value: 'cmd', label: 'um comando numa tecnologia que já existe' },
          { value: 'sheet', label: 'uma tecnologia nova (sheet)' },
        ]);
  if (what === 'cmd') await newCommand(content.technologies);
  else await newSheet(content.technologies);
}

main()
  .catch((e) => {
    if (e instanceof Abort) {
      console.log(yellow(`\ncancelado: ${e.message}`));
      process.exitCode = 1;
    } else throw e;
  })
  .finally(() => rl.close());
