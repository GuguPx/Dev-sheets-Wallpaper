import { z } from 'zod';

export const difficultySchema = z.enum(['basico', 'intermediario', 'avancado']);
export const platformSchema = z.enum(['linux', 'macos', 'windows', 'all']);
export const riskSchema = z.enum(['seguro', 'atencao', 'perigoso']);
export const exampleLevelSchema = z.enum(['basico', 'intermediario', 'avancado']);

export const cheatExampleSchema = z
  .object({
    level: exampleLevelSchema,
    code: z.string().min(1, 'exemplo.code não pode ser vazio'),
    explanation: z.string().min(1, 'exemplo.explanation não pode ser vazio'),
    expected: z.string().optional(),
  })
  .strict();

export const commandArgumentSchema = z
  .object({
    flag: z.string().min(1),
    description: z.string().min(1),
    optional: z.boolean().optional(),
  })
  .strict();

export const cheatEntrySchema = z
  .object({
    id: z
      .string()
      .min(1)
      .regex(/^[a-z0-9-]+$/, 'id deve ser kebab-case (a-z, 0-9, hífen)'),
    title: z.string().min(1),
    command: z.string().min(1),
    description: z.string().min(10, 'description muito curta — explique o comando'),
    category: z.string().min(1),
    tags: z.array(z.string().min(1)).default([]),
    difficulty: difficultySchema,
    platforms: z.array(platformSchema).min(1),
    risk: riskSchema,
    examples: z.array(cheatExampleSchema).default([]),
    arguments: z.array(commandArgumentSchema).default([]),
    warnings: z.array(z.string().min(1)).default([]),
    relatedCommands: z.array(z.string().min(1)).default([]),
    documentationUrl: z.string().url().optional(),
    searchableText: z.string().optional(),
  })
  .strict();

export type CheatEntryInput = z.input<typeof cheatEntrySchema>;
export type CheatEntryParsed = z.output<typeof cheatEntrySchema>;
