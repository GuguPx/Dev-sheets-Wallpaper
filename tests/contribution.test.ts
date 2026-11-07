import { describe, it, expect } from 'vitest';
import { mergeContent, type RawEntryFile } from '@/data/merge';
import { technologySchema } from '@/schemas/technology.schema';
import { cheatEntrySchema } from '@/schemas/cheat-entry.schema';

const entry = (over: Record<string, unknown> = {}) => ({
  id: 'demo-listar',
  title: 'Listar',
  command: 'demo list',
  description: 'Lista os itens do demo para teste.',
  category: 'Base',
  tags: [],
  difficulty: 'basico',
  platforms: ['all'],
  risk: 'seguro',
  examples: [],
  arguments: [],
  warnings: [],
  relatedCommands: [],
  ...over,
});

const tech = {
  id: 'demo',
  name: 'Demo',
  shortName: 'Demo',
  icon: 'terminal',
  color: '#61afef',
  description: 'Tecnologia de teste',
  documentationUrl: 'https://example.com',
  version: '1.0',
  lastReviewedAt: '2026-01-01',
  categories: ['Base'],
  entries: [entry()],
};

const file = (data: unknown, fileId: string, technologyId = 'demo'): RawEntryFile => ({
  source: `entries/${technologyId}/${fileId}.json`,
  technologyId,
  fileId,
  data,
});

describe('mergeContent — comandos avulsos (entries/<tech>/<id>.json)', () => {
  it('soma o comando à sheet', () => {
    const res = mergeContent(
      [{ source: 'demo.json', data: tech }],
      [file(entry({ id: 'demo-novo' }), 'demo-novo')],
    );
    expect(res.errors).toEqual([]);
    expect(res.contributed).toBe(1);
    expect(res.technologies[0].entries.map((e) => e.id)).toEqual(['demo-listar', 'demo-novo']);
  });

  it('cria a categoria nova no fim da lista', () => {
    const res = mergeContent(
      [{ source: 'demo.json', data: tech }],
      [file(entry({ id: 'demo-x', category: 'Nova' }), 'demo-x')],
    );
    expect(res.errors).toEqual([]);
    expect(res.technologies[0].categories).toEqual(['Base', 'Nova']);
    // e o resultado continua válido para o schema da sheet
    expect(technologySchema.safeParse(res.technologies[0]).success).toBe(true);
  });

  it('não altera o objeto de entrada (pura)', () => {
    const copy = JSON.parse(JSON.stringify(tech));
    mergeContent(
      [{ source: 'demo.json', data: copy }],
      [file(entry({ id: 'demo-y', category: 'Z' }), 'demo-y')],
    );
    expect(copy.categories).toEqual(['Base']);
    expect(copy.entries).toHaveLength(1);
  });

  it('rejeita id repetido', () => {
    const res = mergeContent([{ source: 'demo.json', data: tech }], [file(entry(), 'demo-listar')]);
    expect(res.contributed).toBe(0);
    expect(res.errors[0].message).toMatch(/já existe/);
  });

  it('exige nome de arquivo igual ao id', () => {
    const res = mergeContent(
      [{ source: 'demo.json', data: tech }],
      [file(entry({ id: 'demo-a' }), 'outro-nome')],
    );
    expect(res.errors[0].message).toMatch(/demo-a\.json/);
  });

  it('acusa tecnologia inexistente', () => {
    const res = mergeContent(
      [{ source: 'demo.json', data: tech }],
      [file(entry({ id: 'k8s-x' }), 'k8s-x', 'kubernetes')],
    );
    expect(res.errors[0].message).toMatch(/kubernetes/);
  });

  it('acusa comando inválido (schema)', () => {
    const res = mergeContent(
      [{ source: 'demo.json', data: tech }],
      [file(entry({ id: 'demo-b', description: 'curta' }), 'demo-b')],
    );
    expect(res.errors[0].message).toMatch(/description/);
  });
});

describe('saída do editor web (docs/editor) é aceita pelos schemas', () => {
  // Copiado de uma saída real do editor (modo "+ comando" e "+ nova sheet").
  const editorCmd = {
    id: 'git-listar-worktrees',
    title: 'Listar worktrees',
    command: 'git worktree list',
    description: 'Mostra todas as árvores de trabalho ligadas ao repositório.',
    category: 'Inicialização',
    tags: [],
    difficulty: 'basico',
    platforms: ['all'],
    risk: 'seguro',
    examples: [
      {
        level: 'basico',
        code: 'git worktree list --porcelain',
        explanation: 'Saída estável para scripts.',
      },
    ],
    arguments: [],
    warnings: [],
    relatedCommands: [],
    documentationUrl: 'https://git-scm.com/docs/git-worktree',
  };
  const editorSheet = {
    id: 'kubernetes',
    name: 'Kubernetes',
    shortName: 'Kubernetes',
    prompt: 'kubernetes',
    icon: 'terminal',
    color: '#61afef',
    description: 'Orquestrador de containers.',
    documentationUrl: 'https://kubernetes.io/docs/',
    version: 'latest',
    lastReviewedAt: '2026-11-07',
    categories: ['Pods', 'Logs'],
    entries: [
      {
        ...editorCmd,
        id: 'kubernetes-listar-pods',
        title: 'Listar pods',
        command: 'kubectl get pods',
        category: 'Pods',
      },
    ],
  };

  it('comando avulso', () => {
    expect(cheatEntrySchema.safeParse(editorCmd).success).toBe(true);
  });

  it('sheet nova', () => {
    expect(technologySchema.safeParse(editorSheet).success).toBe(true);
  });
});

describe('comando :contribute', () => {
  it('parseia contribute e aliases', async () => {
    const { parseCommand } = await import('@/terminal/CommandParser');
    for (const a of ['contribute', 'contrib', 'contribuir', 'add-sheet']) {
      expect(parseCommand(a)).toEqual({ kind: 'contribute' });
    }
  });
});
