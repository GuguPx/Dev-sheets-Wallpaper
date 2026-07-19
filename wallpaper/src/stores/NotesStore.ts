import { Store } from '@/core/Store';
import type { Note } from '@/types';
import { idbGetAll, idbPut, idbDelete, STORE_NOTES } from '@/services/StorageService';
import { normalize } from '@/utils/normalize';
import { bus } from '@/core/EventBus';

interface NotesState {
  notes: Note[];
  loaded: boolean;
}

/** Anotações pessoais persistidas em IndexedDB (seção 19 da spec). */
class NotesStoreImpl extends Store<NotesState> {
  constructor() {
    super({ notes: [], loaded: false });
  }

  async init(): Promise<void> {
    const notes = await idbGetAll<Note>(STORE_NOTES);
    notes.sort((a, b) => b.updatedAt - a.updatedAt);
    this.setState({ notes, loaded: true });
  }

  private uid(): string {
    return `note-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  async create(partial: Partial<Note>): Promise<Note> {
    const now = Date.now();
    const note: Note = {
      id: this.uid(),
      title: partial.title?.trim() || 'Nova anotação',
      content: partial.content ?? '',
      tags: partial.tags ?? [],
      createdAt: now,
      updatedAt: now,
      technologyId: partial.technologyId,
      entryId: partial.entryId,
      category: partial.category,
      favorite: partial.favorite ?? false,
    };
    await idbPut(STORE_NOTES, note);
    this.setState({ notes: [note, ...this.getState().notes] });
    bus.emit('notes:changed');
    return note;
  }

  async update(id: string, patch: Partial<Note>): Promise<void> {
    const notes = this.getState().notes;
    const idx = notes.findIndex((n) => n.id === id);
    if (idx < 0) return;
    const updated: Note = { ...notes[idx], ...patch, id, updatedAt: Date.now() };
    await idbPut(STORE_NOTES, updated);
    const next = [...notes];
    next[idx] = updated;
    next.sort((a, b) => b.updatedAt - a.updatedAt);
    this.setState({ notes: next });
    bus.emit('notes:changed');
  }

  async remove(id: string): Promise<void> {
    await idbDelete(STORE_NOTES, id);
    this.setState({ notes: this.getState().notes.filter((n) => n.id !== id) });
    bus.emit('notes:changed');
  }

  /** Anota (cria ou atualiza) a nota associada a um comando específico. */
  async setForEntry(technologyId: string, entryId: string, content: string): Promise<void> {
    const existing = this.forEntry(technologyId, entryId)[0];
    if (existing) {
      if (content.trim()) await this.update(existing.id, { content });
      else await this.remove(existing.id);
      return;
    }
    if (content.trim()) {
      await this.create({ technologyId, entryId, content, title: `${technologyId}:${entryId}` });
    }
  }

  forEntry(technologyId: string, entryId: string): Note[] {
    return this.getState().notes.filter(
      (n) => n.technologyId === technologyId && n.entryId === entryId,
    );
  }

  hasNote(technologyId: string, entryId: string): boolean {
    return this.forEntry(technologyId, entryId).some((n) => n.content.trim().length > 0);
  }

  search(query: string): Note[] {
    const q = normalize(query);
    if (!q) return this.getState().notes;
    return this.getState().notes.filter((n) =>
      normalize(`${n.title} ${n.content} ${n.tags.join(' ')}`).includes(q),
    );
  }

  get count(): number {
    return this.getState().notes.length;
  }
}

export const notesStore = new NotesStoreImpl();
