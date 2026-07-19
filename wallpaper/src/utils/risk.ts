import type { RiskLevel } from '@/types';

/**
 * Padrões de comandos potencialmente destrutivos (seção 15 da spec).
 * Rede de segurança: mesmo que o autor esqueça de marcar `risk`, comandos
 * perigosos disparam confirmação antes de copiar.
 */
const DANGEROUS_PATTERNS: RegExp[] = [
  /\brm\s+-[a-z]*r[a-z]*f|\brm\s+-[a-z]*f[a-z]*r/i, // rm -rf / -fr
  /\brm\s+-rf\b/i,
  /\bmkfs\b/i,
  /\bdd\s+if=/i,
  /:\(\)\s*\{.*\|.*&.*\}/, // fork bomb
  /\bdocker\s+system\s+prune\s+-a/i,
  /\bdocker\s+(rm|rmi)\s+-f/i,
  /\bgit\s+reset\s+--hard/i,
  /\bgit\s+clean\s+-[a-z]*f/i,
  /\bgit\s+push\s+.*--force(?!-with-lease)/i,
  /\bDROP\s+(DATABASE|TABLE|SCHEMA)/i,
  /\bTRUNCATE\b/i,
  /\bDELETE\s+FROM\b(?![\s\S]*\bWHERE\b)/i,
  /\bUPDATE\b(?![\s\S]*\bWHERE\b)[\s\S]*\bSET\b/i,
  /\bpm2\s+delete\s+all/i,
  /\bFLUSHALL\b/i,
  /\bFLUSHDB\b/i,
  /\bkubectl\s+delete\b/i,
  /\bchmod\s+-R\s+777/i,
  /\b>\s*\/dev\/sd[a-z]/i,
];

const CAUTION_PATTERNS: RegExp[] = [
  /\bgit\s+rebase\b/i,
  /\bgit\s+push\b/i,
  /\bgit\s+reset\b/i,
  /\bdocker\s+(rm|rmi|prune|stop|kill)\b/i,
  /\bkill\b/i,
  /\bchmod\b/i,
  /\bchown\b/i,
  /\bALTER\s+(TABLE|DATABASE)\b/i,
  /\bDELETE\s+FROM\b/i,
  /\bUPDATE\b/i,
  /\bmv\b/i,
  /\bsystemctl\s+(stop|restart|disable)\b/i,
  /\bnpm\s+(uninstall|prune)\b/i,
];

/** Deriva o nível de risco de um comando pelo seu texto (heurística). */
export function detectRisk(command: string): RiskLevel {
  for (const p of DANGEROUS_PATTERNS) if (p.test(command)) return 'perigoso';
  for (const p of CAUTION_PATTERNS) if (p.test(command)) return 'atencao';
  return 'seguro';
}

/**
 * Combina o risco declarado com a heurística: o mais alto entre os dois vence.
 * Assim, conteúdo mal marcado nunca subestima o perigo.
 */
export function effectiveRisk(declared: RiskLevel | undefined, command: string): RiskLevel {
  const order: RiskLevel[] = ['seguro', 'atencao', 'perigoso'];
  const detected = detectRisk(command);
  const d = declared ?? 'seguro';
  return order.indexOf(detected) >= order.indexOf(d) ? detected : d;
}

/** É um comando destrutivo? (dispara dupla confirmação ao copiar — seção 14.) */
export function isDestructive(risk: RiskLevel): boolean {
  return risk === 'perigoso';
}

export const RISK_LABEL: Record<RiskLevel, string> = {
  seguro: 'Seguro',
  atencao: 'Atenção',
  perigoso: 'Perigoso',
};

/**
 * Mapa risco interno (PT) -> rótulo de terminal em EN (seção 15).
 * `tag` é usada tanto no texto `[safe]` quanto na classe CSS `risk-safe`.
 */
export const RISK_DISPLAY: Record<RiskLevel, { tag: 'safe' | 'warning' | 'danger'; mark: string }> =
  {
    seguro: { tag: 'safe', mark: ' ' },
    atencao: { tag: 'warning', mark: '!' },
    perigoso: { tag: 'danger', mark: '!' },
  };
