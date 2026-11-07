import { z } from 'zod';

/**
 * Tradução do conteúdo de UMA tecnologia (`data/i18n/<idioma>/<tech>.json`).
 *
 * É um "overlay" sobre o JSON-fonte (pt-BR): só traz textos, nunca comandos,
 * flags, ids, risco etc. Tudo é opcional — o que faltar cai no pt-BR. Arrays
 * (`examples`, `arguments`, `warnings`) seguem a MESMA ordem do fonte; posições
 * vazias ("") também caem no pt-BR.
 */
export const entryTranslationSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    /** `explanation` de cada exemplo, na ordem do fonte. */
    examples: z.array(z.string()).optional(),
    /** `description` de cada argumento, na ordem do fonte. */
    arguments: z.array(z.string()).optional(),
    warnings: z.array(z.string()).optional(),
  })
  .strict();

export const technologyTranslationSchema = z
  .object({
    description: z.string().optional(),
    /** Chave da categoria no fonte -> rótulo exibido. */
    categories: z.record(z.string()).optional(),
    entries: z.record(entryTranslationSchema).optional(),
  })
  .strict();

export type EntryTranslation = z.infer<typeof entryTranslationSchema>;
export type TechnologyTranslation = z.infer<typeof technologyTranslationSchema>;
