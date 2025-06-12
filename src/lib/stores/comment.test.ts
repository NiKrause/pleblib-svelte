import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { commentStore, commentOptionsStore, loadComment, setCommentOptions, refreshComment } from './comment.js';
import { getPlebbit } from '../utils/plebbit.js';

// Mock der getPlebbit-Funktion
vi.mock('../utils/plebbit.js', () => {
  return {
    getPlebbit: vi.fn()
  };
});

describe('Comment Store', () => {
  // Mock-Daten für Tests
  const mockComment = {
    cid: 'test-cid',
    title: 'Test Comment',
    content: 'Test Content',
    author: {
      address: 'test-author',
      displayName: 'Test Author'
    },
    timestamp: 1000,
    upvoteCount: 10,
    downvoteCount: 2,
    replyCount: 5
  };

  // Mock der Plebbit-Instanz
  const mockPlebbit = {
    getComment: vi.fn().mockResolvedValue(mockComment)
  };

  beforeEach(() => {
    // Setze den Mock zurück
    vi.resetAllMocks();
    
    // Setze die Stores zurück
    commentStore.set({
      loading: false,
      error: null,
      comment: null
    });
    
    commentOptionsStore.set({
      commentCid: '',
      onlyIfCached: false
    });
    
    // Setze den Mock für getPlebbit
    (getPlebbit as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockPlebbit);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('sollte mit Standardwerten initialisiert werden', () => {
    const commentState = get(commentStore);
    const optionsState = get(commentOptionsStore);
    
    expect(commentState).toEqual({
      loading: false,
      error: null,
      comment: null
    });
    
    expect(optionsState).toEqual({
      commentCid: '',
      onlyIfCached: false
    });
  });

  it('sollte einen Kommentar laden, wenn loadComment aufgerufen wird', async () => {
    // Setze die Kommentar-CID
    await setCommentOptions({ commentCid: 'test-cid' });
    
    // Überprüfe, ob getPlebbit aufgerufen wurde
    expect(getPlebbit).toHaveBeenCalled();
    
    // Überprüfe, ob getComment mit der richtigen CID aufgerufen wurde
    expect(mockPlebbit.getComment).toHaveBeenCalledWith('test-cid');
    
    // Überprüfe, ob der Kommentar geladen wurde
    const commentState = get(commentStore);
    expect(commentState.comment).toEqual(mockComment);
    expect(commentState.loading).toBe(false);
    expect(commentState.error).toBe(null);
  });

  it('sollte einen Fehler setzen, wenn keine Kommentar-CID angegeben ist', async () => {
    await loadComment();
    
    const commentState = get(commentStore);
    expect(commentState.loading).toBe(false);
    expect(commentState.error).toBeInstanceOf(Error);
    expect(commentState.error?.message).toBe('Keine Kommentar-CID angegeben');
  });

  it('sollte den Kommentar aktualisieren, wenn refreshComment aufgerufen wird', async () => {
    // Setze die Kommentar-CID
    await setCommentOptions({ commentCid: 'test-cid' });
    
    // Setze den Mock zurück
    vi.resetAllMocks();
    (getPlebbit as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockPlebbit);
    
    // Rufe refreshComment auf
    await refreshComment();
    
    // Überprüfe, ob getPlebbit erneut aufgerufen wurde
    expect(getPlebbit).toHaveBeenCalled();
    
    // Überprüfe, ob getComment mit der richtigen CID aufgerufen wurde
    expect(mockPlebbit.getComment).toHaveBeenCalledWith('test-cid');
  });

  it('sollte den Ladestatus korrekt setzen', async () => {
    // Erstelle ein Promise, das nicht sofort aufgelöst wird
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    
    // Überschreibe den Mock für getComment
    mockPlebbit.getComment.mockReturnValue(promise);
    
    // Starte das Laden des Kommentars
    const loadPromise = setCommentOptions({ commentCid: 'test-cid' });
    
    // Überprüfe, ob der Ladestatus auf true gesetzt wurde
    expect(get(commentStore).loading).toBe(true);
    
    // Löse das Promise auf
    resolvePromise!(mockComment);
    
    // Warte auf das Laden
    await loadPromise;
    
    // Überprüfe, ob der Ladestatus auf false gesetzt wurde
    expect(get(commentStore).loading).toBe(false);
  });

  it('sollte den Fehlerstatus korrekt setzen, wenn ein Fehler auftritt', async () => {
    // Überschreibe den Mock für getComment, um einen Fehler zu werfen
    const error = new Error('Test Error');
    mockPlebbit.getComment.mockRejectedValue(error);
    
    // Setze die Kommentar-CID
    await setCommentOptions({ commentCid: 'test-cid' });
    
    // Überprüfe, ob der Fehlerstatus korrekt gesetzt wurde
    const commentState = get(commentStore);
    expect(commentState.loading).toBe(false);
    expect(commentState.error).toBe(error);
    expect(commentState.comment).toBe(null);
  });
});