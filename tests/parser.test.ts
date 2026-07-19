import { describe, it, expect } from 'vitest';
import { parseCommand } from '@/terminal/CommandParser';

describe('CommandParser (whitelist, sem eval)', () => {
  it('reconhece comandos canônicos', () => {
    expect(parseCommand('help')).toEqual({ kind: 'help' });
    expect(parseCommand('open git')).toEqual({ kind: 'open', tech: 'git' });
    expect(parseCommand('category branch')).toEqual({ kind: 'category', name: 'branch' });
    expect(parseCommand('search rebase')).toEqual({ kind: 'search', term: 'rebase' });
    expect(parseCommand('favorites')).toEqual({ kind: 'favorites' });
    expect(parseCommand('history')).toEqual({ kind: 'history' });
    expect(parseCommand('notes')).toEqual({ kind: 'notes' });
    expect(parseCommand('theme graphite')).toEqual({ kind: 'theme', name: 'graphite' });
    expect(parseCommand('clear')).toEqual({ kind: 'clear' });
    expect(parseCommand('about')).toEqual({ kind: 'about' });
  });

  it('aceita aliases', () => {
    expect(parseCommand('o docker')).toEqual({ kind: 'open', tech: 'docker' });
    expect(parseCommand('s reset')).toEqual({ kind: 'search', term: 'reset' });
    expect(parseCommand('fav')).toEqual({ kind: 'favorites' });
    expect(parseCommand('recent')).toEqual({ kind: 'history' });
    expect(parseCommand('cat staging')).toEqual({ kind: 'category', name: 'staging' });
  });

  it('parseia tamanho de fonte', () => {
    expect(parseCommand('font 18')).toEqual({ kind: 'font', size: 18 });
    const bad = parseCommand('font abc');
    expect(bad.kind).toBe('font');
    expect((bad as { size: number }).size).toBeNaN();
  });

  it('parseia margens de segurança', () => {
    expect(parseCommand('margin left 200')).toEqual({ kind: 'margin', side: 'left', px: 200 });
    expect(parseCommand('margem direita 80')).toEqual({ kind: 'margin', side: 'right', px: 80 });
    expect(parseCommand('m b 48')).toEqual({ kind: 'margin', side: 'bottom', px: 48 });
    // sem lado explícito, assume a esquerda (ícones da área de trabalho)
    expect(parseCommand('margin 160')).toEqual({ kind: 'margin', side: 'left', px: 160 });
  });

  it('sinaliza lado e valor inválidos na margem', () => {
    expect((parseCommand('margin topo 40') as { side: string | null }).side).toBeNull();
    expect((parseCommand('margin left abc') as { px: number }).px).toBeNaN();
  });

  it('trata vazio, desconhecido e normaliza o head', () => {
    expect(parseCommand('   ')).toEqual({ kind: 'empty' });
    expect(parseCommand('deploy prod')).toEqual({ kind: 'unknown', input: 'deploy prod' });
    expect(parseCommand('  OPEN Git ')).toEqual({ kind: 'open', tech: 'git' });
  });

  it('não interpreta comandos de sistema (segurança)', () => {
    expect(parseCommand('rm -rf /').kind).toBe('unknown');
    expect(parseCommand('sudo reboot').kind).toBe('unknown');
  });
});
