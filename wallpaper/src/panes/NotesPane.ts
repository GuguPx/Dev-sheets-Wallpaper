import { h, clear } from '@/core/dom';
import { t } from '@/i18n';
import { appStore } from '@/stores/AppStore';
import { notesStore } from '@/stores/NotesStore';
import { content, ContentService } from '@/services/ContentService';
import { modes } from '@/terminal/ModeManager';
import { bus } from '@/core/EventBus';

/** Abre o editor de nota para um comando (seção 19). */
export function openNoteEditor(technologyId: string, entryId: string): void {
  const key = ContentService.key(technologyId, entryId);
  const existing = notesStore.forEntry(technologyId, entryId)[0];
  modes.toNotes(key, existing?.content ?? '');
}

/**
 * Editor de nota pessoal (modo NOTES, seção 19). Textarea simples salvo em
 * IndexedDB. Ctrl+Enter salva; Esc cancela. Não é um editor Vim completo.
 */
export class NotesPane {
  readonly el = h('div', { class: 'overlay overlay-notes' });
  private textarea: HTMLTextAreaElement | null = null;

  focusInput(): void {
    this.textarea?.focus();
    const len = this.textarea?.value.length ?? 0;
    this.textarea?.setSelectionRange(len, len);
  }

  private save(): void {
    const st = appStore.getState();
    if (!st.noteEntryKey) return;
    const [tech, ...rest] = st.noteEntryKey.split(':');
    const entryId = rest.join(':');
    void notesStore.setForEntry(tech, entryId, this.textarea?.value ?? '').then(() => {
      bus.emit('toast', { message: t('toast.noteSaved'), kind: 'success' });
      modes.toNormal();
      bus.emit('render');
    });
  }

  render(): void {
    clear(this.el);
    this.textarea = null;
    const st = appStore.getState();
    if (!st.noteEntryKey) return;
    const flat = content.getEntryByKey(st.noteEntryKey);
    const command = flat ? flat.entry.command : st.noteEntryKey;

    const box = h('div', { class: 'notes-box' });
    box.appendChild(h('div', { class: 'notes-head', text: t('notes.head', { command }) }));

    const ta = h('textarea', {
      class: 'notes-area',
      attrs: { spellcheck: false, 'aria-label': t('notes.aria'), rows: 8 },
    }) as HTMLTextAreaElement;
    ta.value = st.noteDraft;
    ta.addEventListener('input', () => appStore.setState({ noteDraft: ta.value }));
    ta.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this.save();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        modes.toNormal();
        bus.emit('render');
      }
      e.stopPropagation();
    });
    box.appendChild(ta);

    const bar = h('div', { class: 'notes-footer' });
    bar.appendChild(
      h('button', {
        class: 'manual-btn',
        attrs: { type: 'button' },
        text: `Ctrl+Enter ${t('notes.save')}`,
        on: { click: () => this.save() },
      }),
    );
    bar.appendChild(
      h('button', {
        class: 'manual-btn',
        attrs: { type: 'button' },
        text: `Esc ${t('notes.cancel')}`,
        on: {
          click: () => {
            modes.toNormal();
            bus.emit('render');
          },
        },
      }),
    );
    box.appendChild(bar);

    this.el.appendChild(box);
    this.textarea = ta;
  }
}
