import { h, clear } from '@/core/dom';
import { appStore } from '@/stores/AppStore';
import { content } from '@/services/ContentService';
import { copyEntry, toggleFavorite, flatByKey } from '@/terminal/actions';
import { modes } from '@/terminal/ModeManager';
import { openNoteEditor } from '@/panes/NotesPane';
import { RISK_DISPLAY } from '@/utils/risk';
import { renderCommandInto } from '@/utils/syntax';
import type { CheatEntry } from '@/types';

/**
 * Painel de detalhes estilo man page (seção 9), aberto no Enter. Rolagem estilo
 * `less` (j/k/PageUp/PageDown/g/G) controlada pelo KeyboardManager via os
 * métodos expostos. Botões de mouse fazem copiar/favoritar/nota/fechar.
 */
export class ManualPane {
  readonly el = h('div', { class: 'overlay overlay-manual' });
  private body: HTMLElement | null = null;

  render(): void {
    clear(this.el);
    this.body = null;
    const key = appStore.getState().manualKey;
    if (!key) return;
    const flat = content.getEntryByKey(key);
    if (!flat) return;
    const e = flat.entry;
    const id = e.id.toUpperCase();
    const tag = RISK_DISPLAY[e.risk].tag;

    const box = h('div', { class: 'manual-box' });

    box.appendChild(
      h(
        'div',
        { class: 'manual-topbar' },
        h('span', { text: `${id}(1)` }),
        h('span', { class: 'manual-center', text: 'DEVSHEET' }),
        h('span', { text: `${id}(1)` }),
      ),
    );

    const body = h('div', { class: 'manual-body' });
    body.appendChild(this.section('NAME', [`${e.command.split(' ')[0]} — ${e.title}`]));

    const syn = h('div', { class: 'manual-section' });
    syn.appendChild(h('div', { class: 'manual-h', text: 'SYNOPSIS' }));
    const synLine = h('div', { class: 'manual-p manual-syn' });
    renderCommandInto(synLine, e.command);
    syn.appendChild(synLine);
    body.appendChild(syn);

    body.appendChild(this.section('DESCRIPTION', [e.description]));

    body.appendChild(
      this.section('META', [
        `risk: [${tag}]   difficulty: ${e.difficulty}   platforms: ${e.platforms.join(', ')}`,
        e.tags.length ? `tags: ${e.tags.join(', ')}` : '',
      ]),
    );

    if (e.arguments.length) {
      const opt = h('div', { class: 'manual-section' });
      opt.appendChild(h('div', { class: 'manual-h', text: 'OPTIONS' }));
      for (const a of e.arguments) {
        opt.appendChild(
          h(
            'div',
            { class: 'manual-opt' },
            h('code', { class: 'manual-flag', text: a.flag }),
            h('span', { class: 'manual-opt-desc', text: a.description }),
          ),
        );
      }
      body.appendChild(opt);
    }

    if (e.examples.length) {
      const ex = h('div', { class: 'manual-section' });
      ex.appendChild(h('div', { class: 'manual-h', text: 'EXAMPLES' }));
      for (const x of e.examples) {
        const code = h('pre', { class: 'manual-ex-code' });
        renderCommandInto(code, x.code);
        ex.appendChild(code);
        ex.appendChild(h('div', { class: 'manual-ex-exp', text: x.explanation }));
        if (x.expected)
          ex.appendChild(h('div', { class: 'manual-ex-out', text: `→ ${x.expected}` }));
      }
      body.appendChild(ex);
    }

    if (e.warnings.length) {
      const w = h('div', { class: 'manual-section manual-warnings' });
      w.appendChild(h('div', { class: 'manual-h manual-h-warn', text: 'WARNINGS' }));
      for (const line of e.warnings)
        w.appendChild(h('div', { class: 'manual-warn', text: `! ${line}` }));
      body.appendChild(w);
    }

    if (e.relatedCommands.length) {
      body.appendChild(this.section('SEE ALSO', [this.relatedLabels(e).join(', ')]));
    }

    if (e.documentationUrl) {
      body.appendChild(this.section('DOCUMENTATION', [e.documentationUrl]));
    }

    box.appendChild(body);
    box.appendChild(this.footer(flat));
    this.el.appendChild(box);
    this.body = body;

    body.addEventListener('scroll', () => this.syncProgress());
  }

  private relatedLabels(e: CheatEntry): string[] {
    return e.relatedCommands.map((rc) => {
      const f = content.getEntryByKey(
        rc.includes(':') ? rc : `${appStore.getState().activeTechnologyId}:${rc}`,
      );
      return f ? `${f.entry.id}(1)` : `${rc}(1)`;
    });
  }

  private section(title: string, lines: string[]): HTMLElement {
    const sec = h('div', { class: 'manual-section' });
    sec.appendChild(h('div', { class: 'manual-h', text: title }));
    for (const l of lines) if (l) sec.appendChild(h('div', { class: 'manual-p', text: l }));
    return sec;
  }

  private footer(flat: ReturnType<typeof flatByKey>): HTMLElement {
    const bar = h('div', { class: 'manual-footer' });
    const btn = (label: string, title: string, fn: () => void) =>
      h('button', {
        class: 'manual-btn',
        attrs: { type: 'button', title },
        text: label,
        on: { click: fn },
      });
    bar.appendChild(btn('y copy', 'copiar comando', () => void copyEntry(flat)));
    bar.appendChild(btn('f fav', 'favoritar', () => toggleFavorite(flat)));
    bar.appendChild(
      btn('n note', 'anotar', () => {
        if (flat) openNoteEditor(flat.technologyId, flat.entry.id);
      }),
    );
    bar.appendChild(btn('q close', 'fechar (Esc)', () => modes.toNormal()));
    return bar;
  }

  // ----------------- rolagem controlada pelo teclado (less) -----------------

  private lineStep(): number {
    return 28;
  }

  scrollLines(n: number): void {
    this.body?.scrollBy({ top: n * this.lineStep() });
  }

  page(dir: number): void {
    if (!this.body) return;
    this.body.scrollBy({ top: dir * this.body.clientHeight * 0.9 });
  }

  toStart(): void {
    if (this.body) this.body.scrollTop = 0;
    this.syncProgress();
  }

  toEnd(): void {
    if (this.body) this.body.scrollTop = this.body.scrollHeight;
    this.syncProgress();
  }

  private syncProgress(): void {
    if (!this.body) return;
    const max = this.body.scrollHeight - this.body.clientHeight;
    const p = max > 0 ? this.body.scrollTop / max : 0;
    if (Math.abs(p - appStore.getState().manualScroll) > 0.005) {
      appStore.setState({ manualScroll: p });
    }
  }
}
