import { writable, derived, get } from 'svelte/store';
import type { Comment, CommentOptions } from '../types/index.js';
import { getPlebbit } from '../utils/plebbit.js';

// Store für Comment-Optionen
export const commentOptionsStore = writable<CommentOptions>({
  commentCid: '',
  onlyIfCached: false
});

// Store für Comment-Daten
export const commentStore = writable<{
  loading: boolean;
  error: Error | null;
  comment: Comment | null;
}>({
  loading: false,
  error: null,
  comment: null
});

// Abgeleiteter Store, der den Kommentar zurückgibt
export const comment = derived(
  [commentStore],
  ([$commentStore]) => $commentStore.comment
);

// Abgeleiteter Store, der den Ladestatus zurückgibt
export const loading = derived(
  [commentStore],
  ([$commentStore]) => $commentStore.loading
);

// Abgeleiteter Store, der den Fehlerstatus zurückgibt
export const error = derived(
  [commentStore],
  ([$commentStore]) => $commentStore.error
);

/**
 * Lädt einen Kommentar basierend auf den angegebenen Optionen
 * @param options - Optionen für den Kommentar
 */
export async function loadComment(options?: Partial<CommentOptions>): Promise<void> {
  try {
    // Aktualisiere die Comment-Optionen, wenn angegeben
    if (options) {
      commentOptionsStore.update((currentOptions) => ({
        ...currentOptions,
        ...options
      }));
    }

    // Setze den Ladestatus
    commentStore.update((state) => ({
      ...state,
      loading: true,
      error: null
    }));

    // Hole die aktuellen Comment-Optionen
    const currentOptions = get(commentOptionsStore);

    // Überprüfe, ob eine Kommentar-CID angegeben ist
    if (!currentOptions.commentCid) {
      throw new Error('Keine Kommentar-CID angegeben');
    }

    // Hole die Plebbit-Instanz
    const plebbit = await getPlebbit();

    // Hole den Kommentar
    const comment = await plebbit.getComment(currentOptions.commentCid);

    // Aktualisiere den Store mit dem geladenen Kommentar
    commentStore.update((state) => ({
      ...state,
      loading: false,
      comment
    }));
  } catch (err) {
    // Setze den Fehlerstatus
    commentStore.update((state) => ({
      ...state,
      loading: false,
      error: err instanceof Error ? err : new Error(String(err))
    }));
  }
}

/**
 * Setzt die Comment-Optionen und lädt den Kommentar neu
 * @param options - Neue Comment-Optionen
 */
export async function setCommentOptions(options: Partial<CommentOptions>): Promise<void> {
  await loadComment(options);
}

/**
 * Aktualisiert den Kommentar mit den aktuellen Optionen
 */
export async function refreshComment(): Promise<void> {
  await loadComment();
}