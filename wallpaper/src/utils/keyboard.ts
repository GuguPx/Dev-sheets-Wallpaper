/**
 * Utilitários de teclado: normaliza um KeyboardEvent em uma string de combo
 * ("ctrl+k", "alt+1", "g", "shift+g") para casar com os atalhos (seções 5/7/18).
 */
export function comboFromEvent(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('ctrl');
  if (e.altKey) parts.push('alt');
  if (e.shiftKey) parts.push('shift');
  const key = e.key.toLowerCase();
  // Ignora teclas modificadoras isoladas.
  if (!['control', 'meta', 'alt', 'shift'].includes(key)) parts.push(key);
  return parts.join('+');
}

/** Verifica se o foco está em um campo editável (para não sequestrar digitação). */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable === true
  );
}

/** Normaliza a tecla "crua" (sem modificadores) para navegação vim-like. */
export function bareKey(e: KeyboardEvent): string {
  return e.key.length === 1 ? e.key : e.key.toLowerCase();
}
