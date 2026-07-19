/**
 * Helpers de DOM sem framework. Cria elementos de forma segura (sem innerHTML
 * para conteúdo dinâmico), com suporte a atributos, eventos e filhos.
 */

type Falsy = false | null | undefined;
export type Child = Node | string | number | Falsy | Child[];

export interface ElProps {
  class?: string | (string | Falsy)[];
  id?: string;
  title?: string;
  role?: string;
  tabIndex?: number;
  html?: string; // uso interno controlado (glifos/box-drawing confiáveis)
  text?: string;
  dataset?: Record<string, string | number | boolean | undefined>;
  attrs?: Record<string, string | number | boolean | undefined>;
  aria?: Record<string, string | number | boolean | undefined>;
  style?: Partial<CSSStyleDeclaration> | Record<string, string>;
  on?: Partial<Record<keyof HTMLElementEventMap, EventListener>> & Record<string, EventListener>;
}

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: ElProps = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);

  if (props.class) {
    const cls = Array.isArray(props.class) ? props.class.filter(Boolean).join(' ') : props.class;
    if (cls) el.className = cls;
  }
  if (props.id) el.id = props.id;
  if (props.title) el.title = props.title;
  if (props.role) el.setAttribute('role', props.role);
  if (props.tabIndex !== undefined) el.tabIndex = props.tabIndex;
  if (props.text !== undefined) el.textContent = props.text;
  if (props.html !== undefined) el.innerHTML = props.html;

  if (props.dataset) {
    for (const [k, v] of Object.entries(props.dataset)) {
      if (v !== undefined) el.dataset[k] = String(v);
    }
  }
  if (props.attrs) {
    for (const [k, v] of Object.entries(props.attrs)) {
      if (v === undefined || v === false) continue;
      el.setAttribute(k, v === true ? '' : String(v));
    }
  }
  if (props.aria) {
    for (const [k, v] of Object.entries(props.aria)) {
      if (v !== undefined) el.setAttribute(`aria-${k}`, String(v));
    }
  }
  if (props.style) {
    for (const [k, v] of Object.entries(props.style)) {
      if (v === undefined || v === null) continue;
      // CSS custom properties (--foo) precisam de setProperty; Object.assign as ignora.
      if (k.startsWith('--')) el.style.setProperty(k, String(v));
      else (el.style as unknown as Record<string, string>)[k] = String(v);
    }
  }
  if (props.on) {
    for (const [ev, handler] of Object.entries(props.on)) {
      if (handler) el.addEventListener(ev, handler as EventListener);
    }
  }

  appendChildren(el, children);
  return el;
}

export function appendChildren(el: Node, children: Child[]): void {
  for (const child of children) {
    if (child === false || child === null || child === undefined) continue;
    if (Array.isArray(child)) {
      appendChildren(el, child);
    } else if (child instanceof Node) {
      el.appendChild(child);
    } else {
      el.appendChild(document.createTextNode(String(child)));
    }
  }
}

/** Remove todos os filhos de um nó. */
export function clear(el: Node): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}

/** Substitui o conteúdo de um nó pelos filhos fornecidos. */
export function replace(el: Node, ...children: Child[]): void {
  clear(el);
  appendChildren(el, children);
}

/** Cria um fragmento a partir de filhos. */
export function frag(...children: Child[]): DocumentFragment {
  const f = document.createDocumentFragment();
  appendChildren(f, children);
  return f;
}

/** Query util tipada. */
export function qs<E extends Element = Element>(
  sel: string,
  root: ParentNode = document,
): E | null {
  return root.querySelector<E>(sel);
}

/**
 * Destaca ocorrências de `term` dentro de `text`, retornando nós DOM.
 * Seguro contra XSS (usa createTextNode / <mark>), com comparação sem acento.
 */
export function highlight(text: string, term: string): (Node | string)[] {
  if (!term) return [text];
  const norm = (s: string) =>
    s
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();
  const nText = norm(text);
  const nTerm = norm(term);
  const out: (Node | string)[] = [];
  let i = 0;
  let idx = nText.indexOf(nTerm);
  while (idx !== -1 && nTerm.length > 0) {
    if (idx > i) out.push(text.slice(i, idx));
    const mark = document.createElement('mark');
    mark.textContent = text.slice(idx, idx + nTerm.length);
    out.push(mark);
    i = idx + nTerm.length;
    idx = nText.indexOf(nTerm, i);
  }
  if (i < text.length) out.push(text.slice(i));
  return out;
}
