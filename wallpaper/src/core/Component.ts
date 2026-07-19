import type { Unsubscribe } from './Store';

/**
 * Classe-base leve para componentes/painéis. Cada um possui um elemento raiz,
 * um método `render` e gerencia desinscrições automaticamente ao ser destruído.
 */
export abstract class Component<TProps = void> {
  readonly el: HTMLElement;
  protected props: TProps;
  private cleanups: Unsubscribe[] = [];

  constructor(props: TProps, tag: keyof HTMLElementTagNameMap = 'div') {
    this.props = props;
    this.el = document.createElement(tag);
  }

  /** Registra uma função de limpeza (desinscrição de store/evento). */
  protected track(unsub: Unsubscribe): void {
    this.cleanups.push(unsub);
  }

  /** Monta o componente dentro de um pai e retorna a instância. */
  mount(parent: Element): this {
    this.render();
    parent.appendChild(this.el);
    return this;
  }

  /** Renderiza (ou re-renderiza) o conteúdo. Deve ser idempotente. */
  abstract render(): void;

  /** Desmonta o componente e executa todas as limpezas. */
  destroy(): void {
    for (const c of this.cleanups) c();
    this.cleanups = [];
    this.el.remove();
  }
}
