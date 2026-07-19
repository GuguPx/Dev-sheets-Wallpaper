/**
 * Monta o pacote final para o Wallpaper Engine (seção 26/30).
 * Após `npm run build`, gera o pacote autocontido em `dist/`:
 *   dist/index.html   (app autocontido, offline)
 *   dist/project.json (metadados + propriedades do WE)
 *   dist/preview.jpg  (opcional)
 *
 * Além disso, **espelha** o pacote direto para a pasta do Wallpaper Engine
 * (`myprojects/Cheat-sheet`), de modo que `myprojects/` contenha apenas os
 * wallpaper prontos — o código-fonte vive em outro lugar (ex.: Área de Trabalho).
 * O destino pode ser sobrescrito via variável de ambiente `WE_OUT`.
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const dist = resolve(here, '../dist');
const indexHtml = resolve(dist, 'index.html');

if (!existsSync(indexHtml)) {
  console.error('dist/index.html não encontrado. Rode "npm run build" primeiro.');
  process.exit(1);
}

// 1) pacote portátil em dist/
copyFileSync(resolve(here, '../wallpaper/project.json'), resolve(dist, 'project.json'));

const previewSrc = resolve(here, '../wallpaper/preview.jpg');
const hasPreview = existsSync(previewSrc);
if (hasPreview) {
  copyFileSync(previewSrc, resolve(dist, 'preview.jpg'));
  console.log('preview.jpg copiado.');
} else {
  console.log('Aviso: wallpaper/preview.jpg não encontrado (thumbnail do WE ficará em branco).');
}
console.log('Pacote pronto em dist/.');

// 2) espelha para a pasta do Wallpaper Engine (só o wallpaper vai para myprojects)
const WE_OUT =
  process.env.WE_OUT ||
  'C:\\Program Files (x86)\\Steam\\steamapps\\common\\wallpaper_engine\\projects\\myprojects\\Cheat-sheet';
try {
  mkdirSync(WE_OUT, { recursive: true });
  copyFileSync(indexHtml, join(WE_OUT, 'index.html'));
  copyFileSync(resolve(dist, 'project.json'), join(WE_OUT, 'project.json'));
  if (hasPreview) copyFileSync(resolve(dist, 'preview.jpg'), join(WE_OUT, 'preview.jpg'));
  console.log('Wallpaper atualizado no Wallpaper Engine:', WE_OUT);
} catch (err) {
  console.warn('Não foi possível escrever em WE_OUT (', WE_OUT, '):', err.message);
  console.warn('Defina WE_OUT para a pasta do wallpaper no Wallpaper Engine, se necessário.');
}
