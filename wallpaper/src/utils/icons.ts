import { h } from '@/core/dom';

/**
 * Ícones de tecnologia em SVG de linha (estilo Lucide), monocromáticos via
 * `currentColor` — assim herdam a cor de acento da tecnologia ou do tema, sem
 * imagens grandes (seção 2). Chaveados pelo `id` da tecnologia. Ícones extra
 * cobrem as tecnologias do roadmap para não caírem no genérico `_default`.
 */
const INNER: Record<string, string> = {
  _default: '<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>',
  git: '<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
  docker:
    '<rect x="3" y="10" width="6" height="6" rx="1"/><rect x="10" y="10" width="6" height="6" rx="1"/><rect x="6.5" y="4" width="6" height="6" rx="1"/><path d="M2 17h20"/>',
  'docker-compose':
    '<path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="M2 12l10 5 10-5"/><path d="M2 17l10 5 10-5"/>',
  linux:
    '<path d="M9 3.5a3 3 0 0 1 6 0c0 1.7-.6 2.7-.6 4 0 1 1 1.7 1.9 3 1.6 2.3 2.7 4.6 2.7 6.5 0 2.2-2.6 3.5-6.9 3.5s-6.9-1.3-6.9-3.5c0-1.9 1.1-4.2 2.7-6.5.9-1.3 1.9-2 1.9-3 0-1.3-.8-2.3-.8-4Z"/><path d="M10 8h.01M14 8h.01M10.5 11.5s.8.8 1.5.8 1.5-.8 1.5-.8"/>',
  bash: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3"/><line x1="13" y1="15" x2="17" y2="15"/>',
  ssh: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.7 12.3 21 2"/><path d="M16 7l3 3"/><path d="M18 5l2 2"/>',
  nginx: '<path d="M12 2 3 7v10l9 5 9-5V7z"/><path d="M8.5 16V9l7 6.5V9"/>',
  pm2: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  postgresql:
    '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>',
  redis:
    '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v6c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 13v4c0 1.66 4 3 9 3s9-1.34 9-3v-4"/>',

  // ---- roadmap (seção "próximos passos") ----
  sql: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>',
  mysql:
    '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>',
  mongodb: '<path d="M12 2c0 0 5 3.5 5 10s-5 10-5 10-5-3.5-5-10 5-10 5-10Z"/><path d="M12 2v20"/>',
  node: '<path d="M12 2 3 7v10l9 5 9-5V7z"/><path d="M9 15V9l6 6V9"/>',
  'node.js': '<path d="M12 2 3 7v10l9 5 9-5V7z"/><path d="M9 15V9l6 6V9"/>',
  nodejs: '<path d="M12 2 3 7v10l9 5 9-5V7z"/><path d="M9 15V9l6 6V9"/>',
  typescript:
    '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 11h5M10.5 11v6"/><path d="M17 16.5c-.4.4-1 .6-1.6.6-1 0-1.6-.6-1.6-1.3 0-1.6 2.8-1 2.8-2.6 0-.6-.5-1.1-1.4-1.1-.6 0-1.1.2-1.5.6"/>',
  javascript:
    '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 11v4.5c0 .8-.5 1.3-1.3 1.3-.6 0-1-.3-1.3-.8"/><path d="M17 12.2c-.3-.5-.8-.8-1.5-.8-1 0-1.6.6-1.6 1.3 0 1.6 2.8 1 2.8 2.6 0 .7-.6 1.3-1.6 1.3-.7 0-1.3-.3-1.6-.9"/>',
  react:
    '<circle cx="12" cy="12" r="1.6"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>',
  'next.js': '<circle cx="12" cy="12" r="9"/><path d="M8 8v8M8 8l8 10M16 8v6"/>',
  nextjs: '<circle cx="12" cy="12" r="9"/><path d="M8 8v8M8 8l8 10M16 8v6"/>',
  express: '<path d="M3 6h18M3 12h18M3 18h12"/><path d="M18 15l3 3-3 3"/>',
  nestjs: '<path d="M12 2 3 7v10l9 5 9-5V7z"/><circle cx="12" cy="12" r="3"/>',
  prisma: '<path d="M5 16 12 3l7 16-7 3-7-3Z"/><path d="M10 8 8 16"/>',
  zod: '<path d="M6 5h12l-8 14h8"/><path d="M6 5l8 14"/>',
  systemd: '<circle cx="12" cy="12" r="9"/><path d="M12 3v9l6 3"/>',
  cron: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  'github-actions':
    '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
  kubernetes: '<path d="M12 2 3 7v10l9 5 9-5V7z"/><path d="M12 8v4l3.5 2M12 12l-3.5 2"/>',
  python:
    '<path d="M12 3c-3 0-4 1.3-4 3v2h5"/><path d="M8 8H6c-1.7 0-3 1-3 4s1.3 4 3 4h2v-3c0-1.7 1.3-3 3-3h2c1.7 0 3-1.3 3-3V6c0-1.7-1-3-4-3"/><path d="M9.5 5.5h.01"/>',
  go: '<path d="M2 10h5M3 13h4"/><circle cx="15" cy="12" r="5"/><path d="M15 11h3"/>',
};

export function techIconSvg(id: string): string {
  const inner = INNER[id] ?? INNER._default;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inner}</svg>`;
}

/**
 * Elemento <span> com o ícone da tecnologia (SVG confiável, definido acima).
 * `color` opcional pinta o glifo com a cor de marca da tecnologia (senão
 * herda a cor do contexto via CSS).
 */
export function techIcon(id: string, cls = 'ic', color?: string): HTMLElement {
  return h('span', {
    class: cls,
    html: techIconSvg(id),
    style: color ? { color } : undefined,
  });
}
