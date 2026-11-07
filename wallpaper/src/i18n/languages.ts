/**
 * Idiomas suportados pela interface e pelo conteúdo.
 *
 * `code` é o identificador usado em settings, `project.json` e nos arquivos de
 * tradução (`i18n/locales/<code>.ts`, `data/i18n/<code>/`). `we` é o código de
 * locale do próprio Wallpaper Engine (pasta `locale/` da instalação), usado para
 * traduzir os rótulos do painel de propriedades.
 *
 * pt-BR é o idioma-fonte: tudo que faltar numa tradução cai nele.
 */
export const LANGUAGES = [
  { code: 'pt-BR', name: 'Português (Brasil)', we: 'pt-br' },
  { code: 'en', name: 'English', we: 'en-us' },
  { code: 'es', name: 'Español', we: 'es-es' },
  { code: 'fr', name: 'Français', we: 'fr-fr' },
  { code: 'de', name: 'Deutsch', we: 'de-de' },
  { code: 'it', name: 'Italiano', we: 'it-it' },
  { code: 'ru', name: 'Русский', we: 'ru-ru' },
  { code: 'zh-CN', name: '简体中文', we: 'zh-chs' },
  { code: 'ja', name: '日本語', we: 'ja-jp' },
  { code: 'ko', name: '한국어', we: 'ko-kr' },
] as const;

export type Locale = (typeof LANGUAGES)[number]['code'];

/** Preferência do usuário: um idioma fixo ou `auto` (segue o sistema). */
export type LanguagePref = Locale | 'auto';

export const SOURCE_LOCALE: Locale = 'pt-BR';

/** Idioma usado no modo `auto` quando o do sistema não é suportado. */
export const FALLBACK_LOCALE: Locale = 'en';

const CODES = LANGUAGES.map((l) => l.code) as readonly string[];

export function isLocale(value: string): value is Locale {
  return CODES.includes(value);
}

/**
 * Casa um código BCP-47 qualquer (ex.: "pt-PT", "zh-Hans-CN", "en_US") com um
 * idioma suportado: primeiro exato, depois pela língua base. null se nenhum.
 */
export function matchLocale(tag: string): Locale | null {
  const norm = tag.trim().replace(/_/g, '-').toLowerCase();
  if (!norm) return null;
  const exact = LANGUAGES.find((l) => l.code.toLowerCase() === norm || l.we === norm);
  if (exact) return exact.code;
  const base = norm.split('-')[0];
  if (base === 'zh') return 'zh-CN';
  if (base === 'pt') return 'pt-BR';
  const byBase = LANGUAGES.find((l) => l.code.toLowerCase().split('-')[0] === base);
  return byBase ? byBase.code : null;
}

/** Resolve a preferência (`auto` ou código) para um idioma suportado. */
export function resolveLocale(pref: string, systemLanguages?: readonly string[]): Locale {
  if (pref !== 'auto') {
    const m = matchLocale(pref);
    if (m) return m;
  }
  const sys =
    systemLanguages ??
    (typeof navigator !== 'undefined'
      ? navigator.languages?.length
        ? navigator.languages
        : [navigator.language]
      : []);
  for (const tag of sys) {
    const m = tag ? matchLocale(tag) : null;
    if (m) return m;
  }
  return FALLBACK_LOCALE;
}

export function languageName(code: Locale): string {
  return LANGUAGES.find((l) => l.code === code)?.name ?? code;
}
