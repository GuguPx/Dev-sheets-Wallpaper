/**
 * Realce de sintaxe leve para comandos, estilo editor (VS Code). Retorna nós
 * DOM (spans com classes .syn-*), sem innerHTML de dado dinâmico — cada token
 * usa textContent, portanto é seguro contra XSS. As cores vêm de CSS variables
 * por tema (themes.css); pode ser desligado via data-syntax="false".
 */

const TOKEN =
  /("[^"]*"|'[^']*')|(<[^>]+>)|(\$\{[^}]+\}|\$\w+|\$\([^)]*\))|(#.*)|(\s+)|(--?[A-Za-z][\w.-]*)|(&&|\|\||[|&;]|\d?>>?&?\d?|[<>])|(\d+(?:\.\d+)?)|([^\s|&;<>]+)/g;

function span(cls: string, text: string): HTMLSpanElement {
  const s = document.createElement('span');
  s.className = cls;
  s.textContent = text;
  return s;
}

/** Divide um comando em nós DOM realçados. */
export function highlightCommand(cmd: string): (HTMLElement | Text)[] {
  const out: (HTMLElement | Text)[] = [];
  let wordIndex = 0;
  let m: RegExpExecArray | null;
  TOKEN.lastIndex = 0;

  while ((m = TOKEN.exec(cmd)) !== null) {
    const [tok, str, ph, variable, comment, ws, flag, op, num, word] = m;
    if (str !== undefined) out.push(span('syn-str', tok));
    else if (ph !== undefined) out.push(span('syn-ph', tok));
    else if (variable !== undefined) out.push(span('syn-var', tok));
    else if (comment !== undefined) out.push(span('syn-comment', tok));
    else if (ws !== undefined) out.push(document.createTextNode(tok));
    else if (flag !== undefined) out.push(span('syn-flag', tok));
    else if (op !== undefined) out.push(span('syn-op', tok));
    else if (num !== undefined) out.push(span('syn-num', tok));
    else if (word !== undefined) {
      const cls = wordIndex === 0 ? 'syn-cmd' : wordIndex === 1 ? 'syn-sub' : 'syn-arg';
      out.push(span(cls, tok));
      wordIndex += 1;
    }
  }
  return out;
}

/** Substitui o conteúdo de um elemento pelo comando realçado. */
export function renderCommandInto(el: HTMLElement, cmd: string): void {
  el.textContent = '';
  for (const node of highlightCommand(cmd)) el.appendChild(node);
}
