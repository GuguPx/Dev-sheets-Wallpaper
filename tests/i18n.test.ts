import { describe, it, expect, afterEach } from 'vitest';
import {
  LANGUAGES,
  catalogOf,
  matchLocale,
  resolveLocale,
  setLocale,
  t,
  type MessageKey,
} from '@/i18n';
import { ptBR } from '@/i18n/locales/pt-BR';
import { content } from '@/services/ContentService';
import { SearchService } from '@/services/SearchService';
import { parseCommand } from '@/terminal/CommandParser';
import { displayWidth, padEndDisplay } from '@/utils/format';

const keys = Object.keys(ptBR) as MessageKey[];
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

afterEach(() => {
  setLocale('pt-BR');
  content.setLocale('pt-BR');
});

describe('catálogos de interface', () => {
  for (const { code } of LANGUAGES) {
    it(`${code}: tem todas as chaves, sem texto vazio`, () => {
      const cat = catalogOf(code);
      expect(cat, `catálogo ${code} não carregado`).toBeDefined();
      for (const k of keys) {
        expect(cat?.[k], `${code}: ${k}`).toBeTypeOf('string');
        expect(cat?.[k]?.trim(), `${code}: ${k} vazio`).not.toBe('');
      }
    });

    it(`${code}: preserva os {parâmetros} do pt-BR`, () => {
      const cat = catalogOf(code)!;
      for (const k of keys) {
        expect(placeholders(cat[k] ?? ''), `${code}: ${k}`).toEqual(placeholders(ptBR[k]));
      }
    });
  }
});

describe('t()', () => {
  it('interpola parâmetros e segue o idioma ativo', () => {
    expect(t('toast.theme', { name: 'ice' })).toBe('tema: ice');
    setLocale('en');
    expect(t('toast.theme', { name: 'ice' })).toBe('theme: ice');
  });

  it('mantém {x} sem valor em vez de apagar', () => {
    expect(t('toast.theme')).toBe('tema: {name}');
  });
});

describe('resolveLocale', () => {
  it('aceita código explícito', () => {
    expect(resolveLocale('ja')).toBe('ja');
    expect(resolveLocale('zh-CN')).toBe('zh-CN');
  });

  it('auto segue os idiomas do sistema', () => {
    expect(resolveLocale('auto', ['pt-PT'])).toBe('pt-BR');
    expect(resolveLocale('auto', ['zh-Hans-CN'])).toBe('zh-CN');
    expect(resolveLocale('auto', ['de-AT', 'en'])).toBe('de');
    expect(resolveLocale('auto', ['ko_KR'])).toBe('ko');
  });

  it('cai no inglês quando o sistema não é suportado', () => {
    expect(resolveLocale('auto', ['pl-PL', 'tr'])).toBe('en');
    expect(resolveLocale('xx', [])).toBe('en');
  });

  it('entende códigos de locale do Wallpaper Engine', () => {
    expect(matchLocale('zh-chs')).toBe('zh-CN');
    expect(matchLocale('pt-br')).toBe('pt-BR');
    expect(matchLocale('en-us')).toBe('en');
  });
});

describe('conteúdo traduzido', () => {
  it('carrega todas as traduções sem erros', () => {
    const { errors } = content.load();
    expect(errors).toEqual([]);
    const translated = content.translatedLocales().sort();
    const expected = LANGUAGES.map((l) => l.code)
      .filter((c) => c !== 'pt-BR')
      .sort();
    expect(translated).toEqual(expected);
  });

  it('troca textos mas preserva ids, comandos, risco e chaves de categoria', () => {
    content.load();
    const pt = content.getEntry('git', 'git-init')!.entry;
    content.setLocale('en');
    const en = content.getEntry('git', 'git-init')!.entry;
    expect(en.id).toBe(pt.id);
    expect(en.command).toBe(pt.command);
    expect(en.risk).toBe(pt.risk);
    expect(en.category).toBe(pt.category);
    expect(en.title).not.toBe(pt.title);
    expect(en.examples.map((x) => x.code)).toEqual(pt.examples.map((x) => x.code));
    expect(content.categoryLabel('git', pt.category)).not.toBe(pt.category);
  });

  it('busca funciona em alfabetos não latinos', () => {
    content.load();
    for (const [locale, field] of [
      ['ru', 'title'],
      ['zh-CN', 'title'],
      ['ja', 'title'],
      ['ko', 'title'],
    ] as const) {
      content.setLocale(locale);
      const svc = new SearchService();
      svc.setIndex(content.getFlatEntries());
      const entry = content.getEntry('git', 'git-init')!.entry;
      // um trecho do título no próprio alfabeto precisa encontrar a entrada
      const word = entry[field].split(/\s+/)[0].slice(0, 4);
      const ids = svc.search(word, 200).map((r) => r.item.entry.id);
      expect(ids, `${locale}: "${word}"`).toContain('git-init');
    }
  });
});

describe('comandos :lang e :support', () => {
  it('parseia lang com e sem argumento', () => {
    expect(parseCommand('lang ja')).toEqual({ kind: 'lang', name: 'ja' });
    expect(parseCommand('idioma')).toEqual({ kind: 'lang', name: '' });
  });

  it('parseia support e aliases', () => {
    for (const a of ['support', 'donate', 'coffee', 'apoiar']) {
      expect(parseCommand(a)).toEqual({ kind: 'support' });
    }
  });
});

describe('largura de terminal (CJK)', () => {
  it('conta ideogramas/hangul como 2 colunas', () => {
    expect(displayWidth('abc')).toBe(3);
    expect(displayWidth('会话')).toBe(4);
    expect(displayWidth('대기 중')).toBe(7);
    expect(displayWidth(padEndDisplay('日本', 10))).toBe(10);
  });
});
