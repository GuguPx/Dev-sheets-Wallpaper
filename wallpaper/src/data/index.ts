/**
 * Descoberta automática de tecnologias.
 *
 * Basta adicionar `src/data/technologies/<algo>.json` — o Vite o inclui no
 * bundle via `import.meta.glob`, sem alterar código. A validação/normalização
 * acontece no ContentService (dados inválidos não passam silenciosamente).
 */
const modules = import.meta.glob('./technologies/*.json', { eager: true });

export interface RawTechnologyModule {
  path: string;
  data: unknown;
}

/** Retorna os módulos JSON crus (não validados), ordenados por caminho. */
export function loadRawTechnologies(): RawTechnologyModule[] {
  return Object.entries(modules)
    .map(([path, mod]) => ({
      path,
      data: (mod as { default: unknown }).default ?? mod,
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
}
