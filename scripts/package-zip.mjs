/**
 * Empacota o wallpaper para distribuir FORA da Steam Workshop (ex.: GitHub
 * Releases): `release/devsheet-wallpaper-v<versão>.zip`, com uma pasta
 * `devsheet/` contendo index.html, project.json, preview.jpg e o guia de
 * instalação. Também grava `release/NOTES.md` com a seção da versão no CHANGELOG
 * (usado como descrição do Release).
 *
 *   npm run package        (faz o build antes)
 *
 * Zip escrito à mão com zlib (deflate) — sem dependências e igual em qualquer SO.
 */
import { deflateRawSync } from 'node:zlib';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const version = pkg.version;

const indexHtml = resolve(root, 'dist/index.html');
if (!existsSync(indexHtml)) {
  console.error('dist/index.html não encontrado. Rode "npm run build" primeiro (ou npm run package).');
  process.exit(1);
}

// Conteúdo do pacote (caminho dentro do zip -> arquivo de origem).
const FOLDER = 'devsheet';
const files = [
  [`${FOLDER}/index.html`, indexHtml],
  [`${FOLDER}/project.json`, resolve(root, 'wallpaper/project.json')],
  [`${FOLDER}/preview.jpg`, resolve(root, 'wallpaper/preview.jpg')],
  [`${FOLDER}/LEIA-ME (README).txt`, resolve(root, 'wallpaper/INSTALL.txt')],
].filter(([name, src]) => {
  if (existsSync(src)) return true;
  console.warn(`aviso: ${src} não encontrado — ${name} fica fora do pacote`);
  return false;
});

// ---------------------------------------------------------------- zip mínimo

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function dosDateTime(d) {
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2);
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { time, date };
}

function zip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const { name, data, mtime } of entries) {
    const nameBuf = Buffer.from(name, 'utf8');
    const compressed = deflateRawSync(data, { level: 9 });
    const crc = crc32(data);
    const { time, date } = dosDateTime(mtime);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); // assinatura do cabeçalho local
    local.writeUInt16LE(20, 4); // versão necessária (2.0)
    local.writeUInt16LE(0x0800, 6); // flag: nomes em UTF-8
    local.writeUInt16LE(8, 8); // método: deflate
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, nameBuf, compressed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); // assinatura do diretório central
    central.writeUInt16LE(20, 4); // feito por (2.0)
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(offset, 42); // posição do cabeçalho local
    centrals.push(central, nameBuf);

    offset += local.length + nameBuf.length + compressed.length;
  }
  const centralBuf = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); // fim do diretório central
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralBuf, end]);
}

// ---------------------------------------------------------------- saída

const outDir = resolve(root, 'release');
mkdirSync(outDir, { recursive: true });

const entries = files.map(([name, src]) => {
  let data = readFileSync(src);
  // .txt com quebras CRLF: abre certinho em qualquer Bloco de Notas.
  if (name.endsWith('.txt')) data = Buffer.from(data.toString('utf8').replace(/\r?\n/g, '\r\n'));
  return { name, data, mtime: statSync(src).mtime };
});
const zipName = `devsheet-wallpaper-v${version}.zip`;
const zipPath = resolve(outDir, zipName);
writeFileSync(zipPath, zip(entries));

// Notas do Release: a seção "## [versão]" do CHANGELOG.
const changelog = readFileSync(resolve(root, 'CHANGELOG.md'), 'utf8').replace(/\r\n/g, '\n');
const section = changelog.match(
  new RegExp(`^## \\[${version.replace(/\./g, '\\.')}\\][^\\n]*\\n([\\s\\S]*?)(?=^## \\[|$(?![\\s\\S]))`, 'm'),
);
const notes = [
  section ? section[1].trim() : `devsheet v${version}`,
  '',
  '---',
  '',
  `**Instalação:** baixe \`${zipName}\`, extraia e, no Wallpaper Engine, use **Abrir Papel de Parede → Abrir papel de parede offline (animado)** e escolha o \`project.json\` da pasta \`devsheet\`. O passo a passo completo está no \`LEIA-ME (README).txt\` dentro do zip.`,
  '',
  `**Install:** download \`${zipName}\`, extract it and in Wallpaper Engine use **Open Wallpaper → Open offline wallpaper (animated)**, then pick \`project.json\` inside the \`devsheet\` folder. Full steps in \`LEIA-ME (README).txt\` inside the zip.`,
  '',
].join('\n');
writeFileSync(resolve(outDir, 'NOTES.md'), notes);
if (!section) console.warn(`aviso: CHANGELOG sem seção "## [${version}]" — NOTES.md ficou genérico`);

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
console.log(`✓ release/${zipName} (${kb(statSync(zipPath).size)})`);
for (const e of entries) console.log(`   ${e.name.padEnd(36)} ${kb(e.data.length)}`);
console.log('✓ release/NOTES.md');
