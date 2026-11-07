/**
 * Internacionalização da interface.
 *
 * - `t(chave, params)` devolve o texto no idioma ativo, com `{param}` interpolado.
 * - Catálogos vivem em `locales/<código>.ts` e são descobertos automaticamente
 *   (`import.meta.glob`): para adicionar um idioma basta criar o arquivo e
 *   registrá-lo em `languages.ts`.
 * - Chave ausente num catálogo cai no pt-BR (idioma-fonte) e, por fim, na
 *   própria chave — a UI nunca fica em branco.
 *
 * O idioma ativo é definido pelo SettingsStore (`setLocale`), a partir da
 * preferência do usuário (Wallpaper Engine, comando `:lang` ou `auto`).
 */
import { ptBR, type MessageKey, type Messages } from './locales/pt-BR';
import { LANGUAGES, SOURCE_LOCALE, type Locale } from './languages';

export * from './languages';
export type { MessageKey, Messages };

const modules = import.meta.glob<{ messages: Messages }>('./locales/*.ts', { eager: true });

const CATALOGS: Partial<Record<Locale, Partial<Messages>>> = { 'pt-BR': ptBR };
for (const [path, mod] of Object.entries(modules)) {
  const code = path.replace(/^.*\/(.+)\.ts$/, '$1') as Locale;
  if (mod.messages && LANGUAGES.some((l) => l.code === code)) CATALOGS[code] = mod.messages;
}

let current: Locale = SOURCE_LOCALE;

export type Params = Record<string, string | number>;

export function t(key: MessageKey, params?: Params): string {
  const msg = CATALOGS[current]?.[key] ?? ptBR[key] ?? key;
  if (!params) return msg;
  return msg.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m));
}

export function getLocale(): Locale {
  return current;
}

/** Troca o idioma ativo. Retorna true se mudou. */
export function setLocale(locale: Locale): boolean {
  if (locale === current) return false;
  current = locale;
  return true;
}

/** Idiomas com catálogo de interface carregado (para testes/diagnóstico). */
export function availableCatalogs(): Locale[] {
  return Object.keys(CATALOGS) as Locale[];
}

/** Catálogo bruto de um idioma (para testes de completude). */
export function catalogOf(locale: Locale): Partial<Messages> | undefined {
  return CATALOGS[locale];
}
