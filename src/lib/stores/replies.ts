import { writable, derived, get } from 'svelte/store';
import type { Comment, RepliesOptions } from '../types/index.js';

// Store für Replies-Optionen
export const repliesOptionsStore = writable<RepliesOptions>({
  comment: {} as Comment,
  sortType: 'new',
  limit: 50,
  flat: false
});

// Store für Replies-Daten
export const repliesStore = writable<{
  loading: boolean;
  error: Error | null;
  replies: Comment[];
}>({
  loading: false,
  error: null,
  replies: []
});

// Abgeleiteter Store, der die Antworten zurückgibt
export const replies = derived(
  [repliesStore],
  ([$repliesStore]) => $repliesStore.replies
);

// Abgeleiteter Store, der den Ladestatus zurückgibt
export const loading = derived(
  [repliesStore],
  ([$repliesStore]) => $repliesStore.loading
);

// Abgeleiteter Store, der den Fehlerstatus zurückgibt
export const error = derived(
  [repliesStore],
  ([$repliesStore]) => $repliesStore.error
);

/**
 * Lädt Antworten basierend auf den angegebenen Optionen
 * @param options - Optionen für die Antworten
 */
export async function loadReplies(options?: Partial<RepliesOptions>): Promise<void> {
  try {
    // Aktualisiere die Replies-Optionen, wenn angegeben
    if (options) {
      repliesOptionsStore.update((currentOptions) => ({
        ...currentOptions,
        ...options
      }));
    }

    // Setze den Ladestatus
    repliesStore.update((state) => ({
      ...state,
      loading: true,
      error: null
    }));

    // Hole die aktuellen Replies-Optionen
    const currentOptions = get(repliesOptionsStore);

    // Überprüfe, ob ein Kommentar angegeben ist
    if (!currentOptions.comment || !currentOptions.comment.cid) {
      throw new Error('Kein gültiger Kommentar angegeben');
    }

    // Hole die Antworten aus dem Kommentar
    const replies = currentOptions.comment.replies || [];

    // Sortiere die Antworten basierend auf dem sortType
    let sortedReplies = [...replies];
    if (currentOptions.sortType === 'new') {
      sortedReplies = sortedReplies.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    } else if (currentOptions.sortType === 'top') {
      sortedReplies = sortedReplies.sort((a, b) => (b.upvoteCount || 0) - (a.upvoteCount || 0));
    }

    // Wenn flat ist true, flache alle verschachtelten Antworten ab
    let flattenedReplies: Comment[] = [];
    if (currentOptions.flat) {
      const flattenReplies = (comments: Comment[]): Comment[] => {
        let result: Comment[] = [];
        for (const comment of comments) {
          result.push(comment);
          if (comment.replies && comment.replies.length > 0) {
            result = result.concat(flattenReplies(comment.replies));
          }
        }
        return result;
      };
      flattenedReplies = flattenReplies(sortedReplies);
    } else {
      flattenedReplies = sortedReplies;
    }

    // Begrenze die Anzahl der Antworten, wenn ein Limit angegeben ist
    if (currentOptions.limit && currentOptions.limit > 0) {
      flattenedReplies = flattenedReplies.slice(0, currentOptions.limit);
    }

    // Aktualisiere den Store mit den geladenen Antworten
    repliesStore.update((state) => ({
      ...state,
      loading: false,
      replies: flattenedReplies
    }));
  } catch (err) {
    // Setze den Fehlerstatus
    repliesStore.update((state) => ({
      ...state,
      loading: false,
      error: err instanceof Error ? err : new Error(String(err))
    }));
  }
}

/**
 * Setzt die Replies-Optionen und lädt die Antworten neu
 * @param options - Neue Replies-Optionen
 */
export async function setRepliesOptions(options: Partial<RepliesOptions>): Promise<void> {
  await loadReplies(options);
}

/**
 * Aktualisiert die Antworten mit den aktuellen Optionen
 */
export async function refreshReplies(): Promise<void> {
  await loadReplies();
}