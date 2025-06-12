import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { repliesStore, repliesOptionsStore, loadReplies, setRepliesOptions, refreshReplies } from './replies.js';
import type { Comment } from '../types/index.js';

describe('Replies Store', () => {
  // Mock-Daten für Tests
  const mockReplies: Comment[] = [
    { 
      cid: 'reply1', 
      content: 'Reply 1', 
      timestamp: 1000, 
      upvoteCount: 10,
      replies: []
    },
    { 
      cid: 'reply2', 
      content: 'Reply 2', 
      timestamp: 2000, 
      upvoteCount: 5,
      replies: [
        {
          cid: 'nested1',
          content: 'Nested Reply 1',
          timestamp: 1500,
          upvoteCount: 3,
          replies: []
        }
      ]
    }
  ];

  const mockComment: Comment = {
    cid: 'test-cid',
    title: 'Test Comment',
    content: 'Test Content',
    timestamp: 3000,
    upvoteCount: 15,
    replies: mockReplies
  };

  beforeEach(() => {
    // Setze die Stores zurück
    repliesStore.set({
      loading: false,
      error: null,
      replies: []
    });
    
    repliesOptionsStore.set({
      comment: {} as Comment,
      sortType: 'new',
      limit: 50,
      flat: false
    });
  });

  it('sollte mit Standardwerten initialisiert werden', () => {
    const repliesState = get(repliesStore);
    const optionsState = get(repliesOptionsStore);
    
    expect(repliesState).toEqual({
      loading: false,
      error: null,
      replies: []
    });
    
    expect(optionsState).toEqual({
      comment: {} as Comment,
      sortType: 'new',
      limit: 50,
      flat: false
    });
  });

  it('sollte Antworten laden, wenn loadReplies aufgerufen wird', async () => {
    // Setze den Kommentar
    await setRepliesOptions({ comment: mockComment });
    
    // Überprüfe, ob die Antworten geladen wurden
    const repliesState = get(repliesStore);
    expect(repliesState.replies).toEqual(mockReplies);
    expect(repliesState.loading).toBe(false);
    expect(repliesState.error).toBe(null);
  });

  it('sollte einen Fehler setzen, wenn kein gültiger Kommentar angegeben ist', async () => {
    await loadReplies();
    
    const repliesState = get(repliesStore);
    expect(repliesState.loading).toBe(false);
    expect(repliesState.error).toBeInstanceOf(Error);
    expect(repliesState.error?.message).toBe('Kein gültiger Kommentar angegeben');
  });

  it('sollte Antworten nach Zeitstempel sortieren, wenn sortType "new" ist', async () => {
    // Setze den Kommentar und den sortType
    await setRepliesOptions({ 
      comment: mockComment,
      sortType: 'new'
    });
    
    // Überprüfe, ob die Antworten nach Zeitstempel sortiert wurden (neueste zuerst)
    const repliesState = get(repliesStore);
    expect(repliesState.replies[0].timestamp).toBe(2000);
    expect(repliesState.replies[1].timestamp).toBe(1000);
  });

  it('sollte Antworten nach Upvotes sortieren, wenn sortType "top" ist', async () => {
    // Setze den Kommentar und den sortType
    await setRepliesOptions({ 
      comment: mockComment,
      sortType: 'top'
    });
    
    // Überprüfe, ob die Antworten nach Upvotes sortiert wurden (meiste zuerst)
    const repliesState = get(repliesStore);
    expect(repliesState.replies[0].upvoteCount).toBe(10);
    expect(repliesState.replies[1].upvoteCount).toBe(5);
  });

  it('sollte verschachtelte Antworten abflachen, wenn flat true ist', async () => {
    // Setze den Kommentar und flat
    await setRepliesOptions({ 
      comment: mockComment,
      flat: true
    });
    
    // Überprüfe, ob die verschachtelten Antworten abgeflacht wurden
    const repliesState = get(repliesStore);
    expect(repliesState.replies.length).toBe(3);
    expect(repliesState.replies.map(r => r.cid)).toContain('nested1');
  });

  it('sollte die Anzahl der Antworten begrenzen, wenn ein Limit angegeben ist', async () => {
    // Setze den Kommentar und das Limit
    await setRepliesOptions({ 
      comment: mockComment,
      limit: 1
    });
    
    // Überprüfe, ob die Anzahl der Antworten begrenzt wurde
    const repliesState = get(repliesStore);
    expect(repliesState.replies.length).toBe(1);
  });

  it('sollte die Antworten aktualisieren, wenn refreshReplies aufgerufen wird', async () => {
    // Setze den Kommentar
    await setRepliesOptions({ comment: mockComment });
    
    // Ändere die Antworten im Kommentar
    const updatedComment = { ...mockComment };
    updatedComment.replies = [mockReplies[0]];
    
    // Setze den Kommentar
    repliesOptionsStore.update(options => ({
      ...options,
      comment: updatedComment
    }));
    
    // Rufe refreshReplies auf
    await refreshReplies();
    
    // Überprüfe, ob die Antworten aktualisiert wurden
    const repliesState = get(repliesStore);
    expect(repliesState.replies.length).toBe(1);
    expect(repliesState.replies[0].cid).toBe('reply1');
  });

  it('sollte den Ladestatus korrekt setzen', async () => {
    // Erstelle eine asynchrone Funktion, die den Ladestatus überprüft
    const checkLoadingState = async () => {
      // Starte das Laden der Antworten
      const loadPromise = setRepliesOptions({ comment: mockComment });
      
      // Überprüfe, ob der Ladestatus auf true gesetzt wurde
      expect(get(repliesStore).loading).toBe(true);
      
      // Warte auf das Laden
      await loadPromise;
      
      // Überprüfe, ob der Ladestatus auf false gesetzt wurde
      expect(get(repliesStore).loading).toBe(false);
    };
    
    await checkLoadingState();
  });
});