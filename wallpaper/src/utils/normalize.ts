/**
 * Normalização de texto para busca: remove acentos, coloca em minúsculas e
 * colapsa espaços. Base para busca case- e accent-insensitive (seção 11).
 */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Divide uma consulta em tokens normalizados não vazios. */
export function tokenize(query: string): string[] {
  return normalize(query)
    .split(/[^a-z0-9+#.@/-]+/i)
    .filter(Boolean);
}

/** Constrói o texto pesquisável de uma entrada (usado na indexação). */
export function buildSearchableText(parts: (string | string[] | undefined)[]): string {
  const flat: string[] = [];
  for (const p of parts) {
    if (!p) continue;
    if (Array.isArray(p)) flat.push(...p);
    else flat.push(p);
  }
  return normalize(flat.join(' '));
}
