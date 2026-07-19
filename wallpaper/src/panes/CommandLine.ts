import { h, clear } from '@/core/dom';
import { appStore } from '@/stores/AppStore';
import { settingsStore } from '@/stores/SettingsStore';
import { activeTechnology } from '@/terminal/actions';
import { modes } from '@/terminal/ModeManager';
import { bus } from '@/core/EventBus';

/**
 * Linha de comando interna (seção 10). NÃO executa comandos do sistema — apenas
 * comandos internos da whitelist (ver CommandParser). Em NORMAL exibe o prompt;
 * em COMMAND ativa um <input> para digitação.
 */
export class CommandLine {
  readonly el = h('div', { class: 'commandline' });
  private input: HTMLInputElement | null = null;

  private promptText(): string {
    const s = settingsStore.getState();
    const tech = activeTechnology();
    const scope = tech ? tech.prompt : '~';
    return `${s.username}@devsheet:${scope}$`;
  }

  focusInput(): void {
    this.input?.focus();
    this.input?.setSelectionRange(this.input.value.length, this.input.value.length);
  }

  render(): void {
    clear(this.el);
    this.input = null;
    const st = appStore.getState();

    this.el.appendChild(h('span', { class: 'cl-prompt', text: this.promptText() }));

    if (st.mode === 'command') {
      const input = h('input', {
        class: 'cl-input',
        attrs: {
          type: 'text',
          spellcheck: false,
          autocomplete: 'off',
          'aria-label': 'comando interno',
        },
      }) as HTMLInputElement;
      input.value = st.commandLine;
      input.addEventListener('input', () => appStore.setState({ commandLine: input.value }));
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          bus.emit('command:submit', { line: input.value });
        } else if (e.key === 'Escape') {
          e.preventDefault();
          modes.toNormal();
        }
        e.stopPropagation();
      });
      this.el.appendChild(input);
      this.input = input;
    } else {
      const hint = h('button', {
        class: 'cl-hint',
        attrs: { type: 'button', title: 'abrir linha de comando (:)' },
        text: 'digite : para comandos internos · / para buscar',
        on: { click: () => modes.toCommand() },
      });
      this.el.appendChild(hint);
    }
  }
}
