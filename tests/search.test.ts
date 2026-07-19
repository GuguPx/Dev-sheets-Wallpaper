import { describe, it, expect } from 'vitest';
import { SearchService } from '@/services/SearchService';
import { normalize } from '@/utils/normalize';
import type { FlatEntry } from '@/types';

function mk(
  command: string,
  description: string,
  opts: { tech?: string; techName?: string; tags?: string[]; category?: string } = {},
): FlatEntry {
  const tech = opts.tech ?? 'git';
  const techName = opts.techName ?? 'Git';
  const tags = opts.tags ?? [];
  const category = opts.category ?? 'repo';
  return {
    technologyId: tech,
    technologyName: techName,
    technologyShortName: techName,
    technologyColor: '#fff',
    entry: {
      id: command.replace(/\s+/g, '-'),
      title: command,
      command,
      description,
      category,
      tags,
      difficulty: 'basico',
      platforms: ['all'],
      risk: 'seguro',
      examples: [],
      arguments: [],
      warnings: [],
      relatedCommands: [],
      searchableText: normalize(
        [command, description, tags.join(' '), techName, category].join(' '),
      ),
    },
  };
}

function service(): SearchService {
  const s = new SearchService();
  s.setIndex([
    mk('git commit -m "msg"', 'Registra alterações no repositório', { tags: ['commit'] }),
    mk('git status', 'Mostra a configuração atual do repositório'),
    mk('docker logs -f <container>', 'Segue os logs em tempo real', {
      tech: 'docker',
      techName: 'Docker',
      tags: ['logs'],
    }),
    mk('docker compose logs -f', 'Logs de todos os serviços do compose', {
      tech: 'docker',
      techName: 'Docker',
    }),
  ]);
  return s;
}

describe('SearchService (offline, FZF)', () => {
  it('encontra por comando', () => {
    const res = service().search('commit');
    expect(res.length).toBeGreaterThan(0);
    expect(res[0].item.entry.command).toContain('commit');
  });

  it('ignora maiúsculas', () => {
    expect(service().search('GIT STATUS').length).toBeGreaterThan(0);
  });

  it('ignora acentos', () => {
    // "configuracao" deve casar com "configuração"
    const res = service().search('configuracao');
    expect(res.some((r) => r.item.entry.command === 'git status')).toBe(true);
  });

  it('exige que todos os tokens casem (AND)', () => {
    const res = service().search('docker logs');
    expect(res.length).toBe(2);
    expect(res.every((r) => r.item.technologyId === 'docker')).toBe(true);
  });

  it('não retorna nada para consulta sem correspondência', () => {
    expect(service().search('kubernetes')).toEqual([]);
  });

  it('agrupa por tecnologia', () => {
    const svc = service();
    const groups = svc.group(svc.search('logs'));
    expect(groups.length).toBe(1);
    expect(groups[0].technologyId).toBe('docker');
  });
});
