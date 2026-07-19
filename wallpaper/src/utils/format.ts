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

export function timeLabel(ts: number): string {
  const d = new Date(ts);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
