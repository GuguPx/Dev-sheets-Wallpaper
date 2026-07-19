import { describe, it, expect } from 'vitest';
import { technologySchema } from '@/schemas/technology.schema';
import { cheatEntrySchema } from '@/schemas/cheat-entry.schema';
import { content } from '@/services/ContentService';

const baseEntry = {
  id: 'git-status',
  title: 'Estado',
  command: 'git status',
  description: 'Mostra o estado atual do repositório e os arquivos modificados.',
  category: 'repo',
  difficulty: 'basico',
  platforms: ['all'],
  risk: 'seguro',
};

describe('Conteúdo embutido', () => {
  it('todas as tecnologias validam com o schema Zod', () => {
    const { errors } = content.load();
    expect(errors).toEqual([]);
    expect(content.totalTechnologies).toBeGreaterThan(0);
    expect(content.totalEntries).toBeGreaterThan(0);
  });

  it('deriva o prompt da tecnologia', () => {
    content.load();
    const git = content.getTechnology('git');
    expect(git?.prompt).toBe('git');
  });
});

describe('cheatEntrySchema', () => {
  it('aceita entrada válida', () => {
    expect(cheatEntrySchema.safeParse(baseEntry).success).toBe(true);
  });

  it('rejeita id fora de kebab-case', () => {
    expect(cheatEntrySchema.safeParse({ ...baseEntry, id: 'Git Status' }).success).toBe(false);
  });

  it('rejeita descrição muito curta', () => {
    expect(cheatEntrySchema.safeParse({ ...baseEntry, description: 'curta' }).success).toBe(false);
  });

  it('rejeita risco em inglês (enum interno é PT)', () => {
    expect(cheatEntrySchema.safeParse({ ...baseEntry, risk: 'safe' }).success).toBe(false);
  });
});

describe('technologySchema', () => {
  const baseTech = {
    id: 'demo',
    name: 'Demo',
    shortName: 'Demo',
    icon: 'i',
    color: '#8a9199',
    description: 'Tecnologia de teste',
    documentationUrl: 'https://example.com',
    version: '1.0',
    lastReviewedAt: '2024-01-01',
    categories: ['repo'],
    entries: [baseEntry],
  };

  it('aceita tecnologia válida', () => {
    expect(technologySchema.safeParse(baseTech).success).toBe(true);
  });

  it('rejeita entrada com categoria não declarada', () => {
    const bad = { ...baseTech, entries: [{ ...baseEntry, category: 'inexistente' }] };
    expect(technologySchema.safeParse(bad).success).toBe(false);
  });

  it('rejeita cor fora de hex', () => {
    expect(technologySchema.safeParse({ ...baseTech, color: 'red' }).success).toBe(false);
  });
});
