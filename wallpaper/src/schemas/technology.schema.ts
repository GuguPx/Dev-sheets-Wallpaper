import { z } from 'zod';
import { cheatEntrySchema } from './cheat-entry.schema';

export const technologySchema = z
  .object({
    id: z
      .string()
      .min(1)
      .regex(/^[a-z0-9-]+$/, 'id da tecnologia deve ser kebab-case'),
    name: z.string().min(1),
    shortName: z.string().min(1).max(24),
    /** Prompt exibido no terminal (ex.: "git"). Opcional: deriva de shortName. */
    prompt: z.string().min(1).max(24).optional(),
    icon: z.string().min(1),
    color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'color deve ser hex (#rrggbb)'),
    description: z.string().min(1),
    documentationUrl: z.string().url(),
    version: z.string().min(1),
    lastReviewedAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'lastReviewedAt deve ser data ISO (YYYY-MM-DD)'),
    categories: z.array(z.string().min(1)).min(1),
    entries: z.array(cheatEntrySchema).min(1, 'tecnologia deve ter ao menos 1 entrada'),
  })
  .strict()
  .superRefine((tech, ctx) => {
    // IDs de entradas devem ser únicos dentro da tecnologia.
    const seen = new Set<string>();
    for (const entry of tech.entries) {
      if (seen.has(entry.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `id de entrada duplicado: "${entry.id}"`,
          path: ['entries'],
        });
      }
      seen.add(entry.id);
      // Categoria da entrada deve existir na lista de categorias da tecnologia.
      if (!tech.categories.includes(entry.category)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `entrada "${entry.id}" usa categoria "${entry.category}" não declarada em categories`,
          path: ['entries'],
        });
      }
    }
  });

export type TechnologyInput = z.input<typeof technologySchema>;
export type TechnologyParsed = z.output<typeof technologySchema>;
