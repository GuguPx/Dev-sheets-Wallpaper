/**
 * Formas de apoiar o autor do devsheet — exibidas pelo comando interno
 * `:support` (aliases: donate, coffee, apoiar…), que mostra a mensagem do autor
 * no idioma ativo e copia o link clicado para a área de transferência.
 *
 * Preencha `value` com o seu link/usuário; itens com `value` vazio ficam ocultos.
 * Mantenha em sincronia com a seção "Apoie o projeto" do README e com
 * `.github/FUNDING.yml`.
 */
export interface SupportLink {
  /** Nome exibido (marca da plataforma). */
  label: string;
  /** URL ou chave copiada ao clicar (ex.: chave PIX). Vazio = oculto. */
  value: string;
}

export const SUPPORT_LINKS: SupportLink[] = [
  { label: 'Buy Me a Coffee', value: 'https://buymeacoffee.com/gataodemane' },
  { label: 'Ko-fi', value: 'https://ko-fi.com/gataodemane' },
  // ex.: 'https://github.com/sponsors/seu-usuario'
  { label: 'GitHub Sponsors', value: '' },
  // ex.: chave PIX aleatória (evite expor CPF/telefone)
  { label: 'PIX (Brasil)', value: '' },
];

export function activeSupportLinks(): SupportLink[] {
  return SUPPORT_LINKS.filter((l) => l.value.trim());
}
