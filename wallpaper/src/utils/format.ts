/** Formatação de texto para a UI de terminal. */

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Converte "remote-branches" / "staging" em "Remote Branches" / "Staging".
 *  Unicode-aware: só capitaliza a 1ª letra de cada palavra (não quebra em acentos). */
export function titleCase(s: string): string {
  return s
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(^|\s)(\p{L})/gu, (_m, sep: string, ch: string) => sep + ch.toUpperCase());
}

/** Relógio HH:MM (ou HH:MM 12h) a partir de um Date. */
export function clockLabel(d: Date, h24: boolean): string {
  if (h24) {
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }
  const h = d.getHours() % 12 || 12;
  const suffix = d.getHours() < 12 ? 'AM' : 'PM';
  return `${pad2(h)}:${pad2(d.getMinutes())} ${suffix}`;
}

/**
 * Caracteres de largura dupla num terminal (East Asian Wide/Fullwidth): CJK,
 * kana, hangul, formas de largura total. Aproximação suficiente para alinhar
 * molduras em chinês/japonês/coreano. Faixas de code points (início, fim).
 */
const WIDE_RANGES: readonly (readonly [number, number])[] = [
  [0x1100, 0x115f], // hangul jamo
  [0x2e80, 0x303e], // radicais CJK, pontuação CJK
  [0x3041, 0x33ff], // hiragana, katakana, compatibilidade CJK
  [0x3400, 0x4dbf], // CJK extensão A
  [0x4e00, 0x9fff], // ideogramas CJK unificados
  [0xa960, 0xa97f], // hangul jamo extendido-A
  [0xac00, 0xd7a3], // sílabas hangul
  [0xf900, 0xfaff], // ideogramas de compatibilidade
  [0xfe30, 0xfe4f], // formas de compatibilidade CJK
  [0xff00, 0xff60], // formas de largura total
  [0xffe0, 0xffe6],
];

function isWide(cp: number): boolean {
  return WIDE_RANGES.some(([a, b]) => cp >= a && cp <= b);
}

/** Largura em colunas de terminal (CJK conta 2). */
export function displayWidth(s: string): number {
  let w = 0;
  for (const ch of s) w += isWide(ch.codePointAt(0) ?? 0) ? 2 : 1;
  return w;
}

/** `padEnd` que respeita a largura de terminal (ver `displayWidth`). */
export function padEndDisplay(s: string, width: number): string {
  return s + ' '.repeat(Math.max(0, width - displayWidth(s)));
}

export function timeLabel(ts: number): string {
  const d = new Date(ts);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
